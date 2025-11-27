// Import from our separate Config file
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { collection, addDoc, getDocs, doc, deleteDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// --- TABS & UTILS ---
window.showTab = (tab) => {
    document.getElementById('tab-single').classList.add('hidden');
    document.getElementById('tab-bulk').classList.add('hidden');
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
};

const loader = document.getElementById('genLoader');

// --- AUTHENTICATION ---
if (document.getElementById('loginBtn')) {
    document.getElementById('loginBtn').addEventListener('click', () => {
        const email = document.getElementById('adminEmail').value;
        const pass = document.getElementById('adminPass').value;
        signInWithEmailAndPassword(auth, email, pass).catch(e => alert("Login Failed: " + e.message));
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        signOut(auth).then(() => location.reload());
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');
            loadCertificates();
        } else {
            document.getElementById('loginSection').classList.remove('hidden');
            document.getElementById('dashboardSection').classList.add('hidden');
        }
    });
}

// --- SINGLE GENERATE ---
if (document.getElementById('generateBtn')) {
    document.getElementById('generateBtn').addEventListener('click', async () => {
        const name = document.getElementById('studentName').value;
        const email = document.getElementById('studentEmail').value;
        const course = document.getElementById('courseName').value;
        const start = document.getElementById('startDate').value;
        const end = document.getElementById('endDate').value;
        const photo = document.getElementById('studentPhotoURL').value;

        if (!name || !course || !start) { alert("Fill required fields"); return; }
        loader.style.display = 'block';

        try {
            await createAndMint(name, email, course, start, end, photo, true);
            // Reset
            document.getElementById('studentName').value = '';
            document.getElementById('studentEmail').value = '';
        } catch (e) {
            console.error(e); alert(e.message);
        } finally {
            loader.style.display = 'none';
        }
    });
}

// --- CORE FUNCTION: SAVE & MINT ---
async function createAndMint(name, email, course, start, end, photo, downloadNow) {
    const uniqueID = 'WS-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const photoURL = photo && photo.trim() !== "" ? photo : "https://via.placeholder.com/150/00f3ff/000000?text=USER";

    // 1. Save to DB
    await addDoc(collection(db, "certificates"), {
        certID: uniqueID, studentName: name, studentEmail: email,
        courseName: course, startDate: start, endDate: end,
        photoURL: photoURL, createdAt: new Date()
    });

    // 2. Generate PDF
    if (downloadNow) {
        await generatePDF(name, course, start, end, uniqueID, photoURL, true);
        loadCertificates();
    }
}

// --- BULK UPLOAD ---
if (document.getElementById('bulkBtn')) {
    document.getElementById('bulkBtn').addEventListener('click', () => {
        const fileInput = document.getElementById('csvFile');
        const status = document.getElementById('bulkStatus');
        
        if(fileInput.files.length === 0) { alert("Select CSV"); return; }
        
        const reader = new FileReader();
        reader.onload = async function(e) {
            const rows = e.target.result.split('\n');
            status.innerText = `Processing ${rows.length - 1} records...`;
            
            let count = 0;
            for(let i=1; i<rows.length; i++) {
                const cols = rows[i].split(',');
                if(cols.length < 5) continue; 
                // CSV: Name,Email,Course,Start,End,Photo
                await createAndMint(cols[0].trim(), cols[1].trim(), cols[2].trim(), cols[3].trim(), cols[4].trim(), cols[5]?.trim(), false);
                count++;
                status.innerText = `Minted ${count} / ${rows.length - 1}`;
            }
            alert("Bulk Process Complete!");
            loadCertificates();
        };
        reader.readAsText(fileInput.files[0]);
    });
}

// --- PDF ENGINE ---
async function generatePDF(name, course, start, end, id, photoURL, isDownload) {
    // Fill Data
    document.getElementById('pdfName').innerText = name;
    document.getElementById('pdfCourse').innerText = course;
    document.getElementById('pdfStart').innerText = start;
    document.getElementById('pdfEnd').innerText = end;
    document.getElementById('pdfID').innerText = "ID: " + id;
    
    // Image Handling
    const img = document.getElementById('pdfPhoto');
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = photoURL;
    
    // QR Code
    document.getElementById('pdfQR').innerHTML = "";
    new QRCode(document.getElementById('pdfQR'), {
        text: `${window.location.origin}/index.html?id=${id}`,
        width: 80, height: 80, colorDark : "#00f3ff", colorLight : "#000000",
        correctLevel : QRCode.CorrectLevel.L
    });

    // Wait for Image
    await new Promise(r => {
        if(img.complete) r();
        else { img.onload = r; img.onerror = r; setTimeout(r, 2000); }
    });

    // Return if just for View
    if (!isDownload) return;

    // Capture & Download
    const canvas = await window.html2canvas(document.querySelector("#certDOM"), {
        backgroundColor: "#000000", useCORS: true, scale: 2
    });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'mm', 'a4');
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 297, 210);
    pdf.save(`${name.replace(/ /g,'_')}_${id}.pdf`);
}

// --- DASHBOARD DATA & SEARCH ---
async function loadCertificates() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    // Analytics
    let total = 0, month = 0, courses = new Set();
    const currMonth = new Date().getMonth();

    const q = query(collection(db, "certificates"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    snap.forEach((docSnap) => {
        const d = docSnap.data();
        total++;
        if(d.createdAt.toDate().getMonth() === currMonth) month++;
        courses.add(d.courseName);

        const sName = d.studentName.replace(/'/g, "\\'");
        const sCourse = d.courseName.replace(/'/g, "\\'");
        
        // Mail Link
        const mailLink = `mailto:${d.studentEmail}?subject=Certificate for ${d.courseName}&body=Hi ${d.studentName}, verify your cert here: ${window.location.origin}/index.html?id=${d.certID}`;

        const row = `
            <tr style="border-bottom:1px solid #333;" class="data-row">
                <td style="padding:10px;">
                    <div style="color:var(--neon-blue); font-weight:bold;">${d.studentName}</div>
                    <div style="font-size:0.75rem; color:#888;">${d.certID} | ${d.studentEmail || 'No Email'}</div>
                </td>
                <td>${d.courseName}</td>
                <td style="text-align:right; white-space:nowrap;">
                    <a href="${mailLink}" class="btn-cyber" style="text-decoration:none; padding:4px 8px; font-size:0.7rem; color:#fff; border-color:#fff;">✉</a>
                    <button class="btn-cyber" style="width:auto; padding:4px 8px; font-size:0.7rem;" 
                        onclick="triggerView('${d.certID}','${sName}','${sCourse}','${d.startDate}','${d.endDate}','${d.photoURL}')">👁</button>
                    <button class="btn-cyber" style="width:auto; padding:4px 8px; font-size:0.7rem;" 
                        onclick="triggerDL('${d.certID}','${sName}','${sCourse}','${d.startDate}','${d.endDate}','${d.photoURL}')">⬇</button>
                    <button class="btn-danger" style="width:auto; padding:4px 8px; font-size:0.7rem;" 
                        onclick="deleteCert('${docSnap.id}')">X</button>
                </td>
            </tr>`;
        tableBody.innerHTML += row;
    });

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statMonth').innerText = month;
    document.getElementById('statCourses').innerText = courses.size;
}

// --- SEARCH FILTER ---
if(document.getElementById('searchInput')) {
    document.getElementById('searchInput').addEventListener('keyup', function() {
        const val = this.value.toLowerCase();
        document.querySelectorAll('.data-row').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(val) ? '' : 'none';
        });
    });
}

// --- EXPORT CSV ---
window.exportToCSV = () => {
    let csv = "data:text/csv;charset=utf-8,ID,Name,Email,Course\n";
    document.querySelectorAll('.data-row').forEach(row => {
        if(row.style.display !== 'none') {
            // Simplified extraction for demo
            csv += row.innerText.replace(/\n/g, ",").trim() + "\n";
        }
    });
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "webspyder_db.csv";
    link.click();
};

// --- GLOBAL HELPERS (Accessible from HTML) ---
window.triggerDL = async (id,n,c,s,e,p) => {
    if(confirm('Download PDF?')) await generatePDF(n,c,s,e,id,p,true);
};

window.triggerView = async (id,n,c,s,e,p) => {
    await generatePDF(n,c,s,e,id,p,false); // Fill template
    const clone = document.getElementById('certDOM').cloneNode(true);
    clone.style.width = "800px"; clone.style.height = "600px";
    document.getElementById('previewContainer').innerHTML = "";
    document.getElementById('previewContainer').appendChild(clone);
    document.getElementById('viewModal').classList.remove('hidden');
};

window.deleteCert = async (id) => {
    if(confirm("Delete Permanently?")) {
        await deleteDoc(doc(db, "certificates", id));
        loadCertificates();
    }
};

// --- PUBLIC VERIFY ---
if (document.getElementById('verifyBtn')) {
    document.getElementById('verifyBtn').addEventListener('click', async () => {
        const id = document.getElementById('verifyInput').value.trim();
        if(!id) return;
        
        document.getElementById('verifyLoader').style.display = 'block';
        document.getElementById('resultCard').classList.add('hidden');

        try {
            const q = query(collection(db, "certificates"), where("certID", "==", id));
            const snap = await getDocs(q);
            if(snap.empty) { alert("Invalid Certificate ID"); }
            else {
                const d = snap.docs[0].data();
                document.getElementById('resName').innerText = d.studentName;
                document.getElementById('resCourse').innerText = d.courseName;
                document.getElementById('resDate').innerText = `${d.startDate} to ${d.endDate}`;
                document.getElementById('resID').innerText = d.certID;
                document.getElementById('resPhoto').src = d.photoURL;
                document.getElementById('resultCard').classList.remove('hidden');
            }
        } catch(e) { console.log(e); } 
        finally { document.getElementById('verifyLoader').style.display = 'none'; }
    });

    const url = new URLSearchParams(window.location.search);
    if(url.get('id')) {
        document.getElementById('verifyInput').value = url.get('id');
        document.getElementById('verifyBtn').click();
    }
}