import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
        import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, query, where, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

        // --- 1. CONFIG (Տեղադրիր քոնը) ---
       const firebaseConfig = { apiKey: "AIzaSyAV_if7XCjF4IViBp5wUrH9N1MZP0pEpuY", authDomain: "vip-club-1d7aa.firebaseapp.com", projectId: "vip-club-1d7aa", storageBucket: "vip-club-1d7aa.firebasestorage.app", messagingSenderId: "875199846449", appId: "1:875199846449:web:d963cc881d9bb8dc211d10", measurementId: "G-RLXV8D5QQ1" };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        let currentUser = null;
        let miningInterval = null;

        // --- AUTH ---
        window.handleRegister = async () => {
            const email = document.getElementById('email').value;
            const pass = document.getElementById('pass').value;
            const refBy = new URLSearchParams(window.location.search).get('ref');
            try {
                const cred = await createUserWithEmailAndPassword(auth, email, pass);
                const myRefCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                await setDoc(doc(db, "users", cred.user.uid), {
                    email, balance: 0, referralCode: myRefCode, referredBy: refBy || null, createdAt: new Date()
                });
                if (refBy) {
                    const q = query(collection(db, "users"), where("referralCode", "==", refBy));
                    const snap = await getDocs(q);
                    if (!snap.empty) await updateDoc(doc(db, "users", snap.docs[0].id), { balance: increment(0.1) });
                }
            } catch (e) { alert(e.message); }
        };

        window.handleLogin = async () => {
            try { await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('pass').value); } 
            catch (e) { alert(e.message); }
        };

        window.handleLogout = () => signOut(auth);

        // --- MINING ---
        window.toggleMining = () => {
            const btn = document.getElementById('mineBtn');
            const status = document.getElementById('miningStatus');
            const bar = document.getElementById('progressBar');

            if (miningInterval) {
                clearInterval(miningInterval);
                miningInterval = null;
                btn.innerText = "START ENGINE";
                status.innerText = "STANDBY";
                status.classList.remove('neon-text', 'mining-animate');
                bar.style.width = "0%";
            } else {
                miningInterval = setInterval(runCycle, 10000);
                runCycle();
                btn.innerText = "STOP ENGINE";
                status.innerText = "CORE ACTIVE";
                status.classList.add('neon-text', 'mining-animate');
            }
        };

        async function runCycle() {
            if (!miningInterval || !currentUser) return;
            const bar = document.getElementById('progressBar');
            bar.style.transition = "none"; bar.style.width = "0%";
            setTimeout(() => { if(miningInterval) { bar.style.transition = "width 10s linear"; bar.style.width = "100%"; } }, 50);
            setTimeout(async () => { if(currentUser && miningInterval) await updateDoc(doc(db, "users", currentUser.uid), { balance: increment(0.001) }); }, 10000);
        }

        // --- UI & MODAL ---
        window.closeModal = () => document.getElementById('tgModal').classList.add('hidden');

        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            if (user) {
                document.getElementById('tgModal').classList.remove('hidden'); // Ցուցադրել Տելեգրամը մուտքից հետո
                onSnapshot(doc(db, "users", user.uid), (snap) => {
                    const d = snap.data();
                    document.getElementById('balance').innerText = d.balance.toFixed(4);
                    document.getElementById('refLink').value = `${window.location.origin}${window.location.pathname}?ref=${d.referralCode}`;
                    syncNotifs(d.referralCode);
                    document.getElementById('authSection').classList.add('hidden');
                    document.getElementById('mainSection').classList.remove('hidden');
                });
            } else {
                document.getElementById('authSection').classList.remove('hidden');
                document.getElementById('mainSection').classList.add('hidden');
            }
        });

        function syncNotifs(refCode) {
            const q = query(collection(db, "users"), where("referredBy", "==", refCode));
            onSnapshot(q, (snap) => {
                const list = document.getElementById('notifList');
                document.getElementById('refCount').innerText = snap.size;
                list.innerHTML = "";
                snap.forEach(doc => {
                    const d = doc.data();
                    const item = document.createElement('div');
                    item.className = "glass p-4 rounded-2xl border-l-2 border-cyan-400 flex justify-between items-center text-[11px]";
                    item.innerHTML = `<span class="text-gray-300 italic">${d.email}</span><span class="neon-text">+0.10 USDT</span>`;
                    list.appendChild(item);
                });
            });
        }

        window.copyRef = () => { navigator.clipboard.writeText(document.getElementById('refLink').value); alert("Հղումը պատճենվեց:"); };
   
