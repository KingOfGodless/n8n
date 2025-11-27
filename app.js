import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDjQRvWRNlKUJ_Xq88zZWJf7yJNNigXSPo",
    authDomain: "tamizhaapp-d6ca6.firebaseapp.com",
    databaseURL: "https://tamizhaapp-d6ca6-default-rtdb.firebaseio.com",
    projectId: "tamizhaapp-d6ca6",
    storageBucket: "tamizhaapp-d6ca6.firebasestorage.app",
    messagingSenderId: "727816041677",
    appId: "1:727816041677:web:66c3df6a23beeb0b5a6584",
    measurementId: "G-9X1E5180VC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- ELEMENTS ---
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const certTableBody = document.querySelector('#certTable tbody');

// --- AUTHENTICATION ---
if (document.getElementById('loginBtn')) {
    document.getElementById('loginBtn').addEventListener('click', () => {
        const email = document.getElementById('adminEmail').value;
        const pass = document.getElementById('adminPass').value;
        signInWithEmailAndPassword(auth, email, pass)
            .catch(err => alert("Access Denied: " + err.message));
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        signOut(auth).then(() => location.reload());
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            loadCertificates();
        } else {
            loginSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
        }
    });
}

// --- GENERATE CERTIFICATE ---
if (document.getElementById('generateBtn')) {
    document.getElementById('generateBtn').addEventListener('click', async () => {
        const name = document.getElementById('studentName').value;
        const course = document.getElementById('courseName').value;
        const date = document.getElementById('issueDate').value;
        const photoInput = document.getElementById('studentPhotoURL').value;
        const loader = document.getElementById('genLoader');

        if (!name || !course || !date) { alert("Missing Details"); return; }
        loader.style.display = 'block';

        try {
            const uniqueID = 'WS-' + Math.random().toString(36).substr(2, 6).toUpperCase();
            // Use provided link or default placeholder
            const photoURL = photoInput.trim() !== "" ? photoInput : "https://via.placeholder.com/150/00f3ff/000000?text=USER";

            // Save to Firestore
            await addDoc(collection(db, "certificates"), {
                certID: uniqueID,
                studentName: name,
                courseName: course,
                issueDate: date,
                photoURL: photoURL,
                createdAt: new Date()
            });

            // Create PDF
            await generatePDF(name, course, date, uniqueID, photoURL);
            
            alert(`Certificate ${uniqueID} Created!`);
            loadCertificates();
            // Clear Form
            document.getElementById('studentName').value = '';
            document.getElementById('studentPhotoURL').value = '';

        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
        } finally {
            loader.style.display = 'none';
        }
    });
}

// --- PDF GENERATION LOGIC ---
async function generatePDF(name, course, date, id, photoURL) {
    const canvasContainer = document.getElementById('cert-canvas-container');
    const pdfPhoto = document.getElementById('pdfPhoto');
    const qrContainer = document.getElementById('pdfQR');

    // Show template
    canvasContainer.style.display = 'block';
    
    // Fill text
    document.getElementById('pdfName').innerText = name;
    document.getElementById('pdfCourse').innerText = course;
    document.getElementById('pdfDate').innerText = date;
    document.getElementById('pdfID').innerText = "ID: " + id;
    
    // Handle Photo (CORS is critical here)
    pdfPhoto.setAttribute('crossOrigin', 'anonymous');
    pdfPhoto.src = photoURL;

    // Generate QR
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
        text: `${window.location.origin}/index.html?id=${id}`,
        width: 80, height: 80,
        colorDark : "#00f3ff", colorLight : "#000000",
        correctLevel : QRCode.CorrectLevel.H
    });

    // Wait for image
    await new Promise((resolve) => {
        if(pdfPhoto.complete) resolve();
        else pdfPhoto.onload = resolve;
        pdfPhoto.onerror = resolve; // Continue even if image breaks
        setTimeout(resolve, 2000);
    });

    // Capture & Save
    const canvas = await window.html2canvas(document.querySelector("#certDOM"), {
        backgroundColor: "#000000", useCORS: true, scale: 2
    });

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    pdf.save(`WebSpyder_${id}.pdf`);

    canvasContainer.style.display = 'none';
}

// --- ADMIN LIST ---
async function loadCertificates() {
    certTableBody.innerHTML = '';
    const q = query(collection(db, "certificates"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    snapshot.forEach((doc) => {
        const d = doc.data();
        certTableBody.innerHTML += `
            <tr style="border-bottom:1px solid #333;">
                <td style="color:var(--neon-blue); padding:10px;">${d.certID}</td>
                <td>${d.studentName}</td>
                <td style="text-align:right;">
                    <button class="btn-danger" onclick="deleteCert('${doc.id}')">X</button>
                </td>
            </tr>`;
    });
}
window.deleteCert = async (id) => {
    if(confirm("Delete this certificate?")) {
        await deleteDoc(doc(db, "certificates", id));
        loadCertificates();
    }
};

// --- PUBLIC VERIFICATION ---
window.verifyCertificate = async () => {
    const inputID = document.getElementById('verifyInput').value.trim();
    const loader = document.getElementById('verifyLoader');
    const resultCard = document.getElementById('resultCard');

    if (!inputID) return;
    loader.style.display = 'block';
    resultCard.classList.add('hidden');

    try {
        const q = query(collection(db, "certificates"), where("certID", "==", inputID));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            alert("Certificate Not Found or Invalid ID.");
        } else {
            const d = snapshot.docs[0].data();
            document.getElementById('resName').innerText = d.studentName;
            document.getElementById('resCourse').innerText = d.courseName;
            document.getElementById('resDate').innerText = d.issueDate;
            document.getElementById('resID').innerText = d.certID;
            document.getElementById('resPhoto').src = d.photoURL;
            resultCard.classList.remove('hidden');
        }
    } catch (e) { alert("Verification Failed"); } 
    finally { loader.style.display = 'none'; }
};

// Auto Verify via URL param
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('id') && document.getElementById('verifyInput')) {
    document.getElementById('verifyInput').value = urlParams.get('id');
    window.verifyCertificate();
}