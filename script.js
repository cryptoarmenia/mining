import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
        import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

       // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAV_if7XCjF4IViBp5wUrH9N1MZP0pEpuY",
  authDomain: "vip-club-1d7aa.firebaseapp.com",
  projectId: "vip-club-1d7aa",
  storageBucket: "vip-club-1d7aa.firebasestorage.app",
  messagingSenderId: "875199846449",
  appId: "1:875199846449:web:d963cc881d9bb8dc211d10",
  measurementId: "G-RLXV8D5QQ1"
};

        const app = initializeApp(firebaseConfig);
        const auth = getAuth();
        const db = getFirestore();

        let isMining = false;
        let miningInterval;
        let countdownInterval;
        let timeLeft = 15;

        window.handleAuth = async (type) => {
            const email = document.getElementById('email').value;
            const pass = document.getElementById('password').value;
            try {
                if (type === 'register') {
                    const res = await createUserWithEmailAndPassword(auth, email, pass);
                    await setDoc(doc(db, "users", res.user.uid), { balance: 0, email: email });
                } else {
                    await signInWithEmailAndPassword(auth, email, pass);
                }
            } catch (err) { alert("Email or Password Error"); }
        };

        window.logout = () => signOut(auth);

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                document.getElementById('auth-section').classList.add('hidden');
                document.getElementById('mining-section').classList.remove('hidden');
                document.getElementById('display-email').innerText = user.email;
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    document.getElementById('balance').innerText = userDoc.data().balance.toFixed(8);
                } else {
                    await setDoc(doc(db, "users", user.uid), { balance: 0, email: user.email });
                }
            } else {
                document.getElementById('auth-section').classList.remove('hidden');
                document.getElementById('mining-section').classList.add('hidden');
                stopMiningLogic();
            }
        });

        window.toggleMining = () => {
            isMining = !isMining;
            const btn = document.getElementById('mine-btn');
            if (isMining) {
                btn.innerText = "STOP MINING";
                btn.style.backgroundColor = "#dc2626"; // Red
                btn.classList.add('mining-pulse');
                startMiningLogic();
            } else {
                stopMiningLogic();
            }
        };

        async function startMiningLogic() {
            document.getElementById('status-indicator').classList.replace('bg-slate-700', 'bg-green-500');
            document.getElementById('status-text').innerText = "Մայնինգը ակտիվ է...";
            document.getElementById('hash-rate').innerText = (Math.random() * 40 + 20).toFixed(2) + " TH/s";

            countdownInterval = setInterval(() => {
                timeLeft--;
                document.getElementById('timer').innerText = timeLeft + "s";
                if(timeLeft <= 0) timeLeft = 15;
            }, 1000);

            miningInterval = setInterval(async () => {
                const user = auth.currentUser;
                if (user) {
                    const reward = 0.00000001;
                    const userRef = doc(db, "users", user.uid);
                    await updateDoc(userRef, { balance: increment(reward) });
                    const newDoc = await getDoc(userRef);
                    document.getElementById('balance').innerText = newDoc.data().balance.toFixed(8);
                }
            }, 15000);
        }

        function stopMiningLogic() {
            isMining = false;
            clearInterval(miningInterval);
            clearInterval(countdownInterval);
            timeLeft = 15;
            const btn = document.getElementById('mine-btn');
            if (btn) {
                btn.innerText = "START MINING";
                btn.style.backgroundColor = "#2563eb"; // Blue
                btn.classList.remove('mining-pulse');
                document.getElementById('status-indicator').classList.replace('bg-green-500', 'bg-slate-700');
                document.getElementById('status-text').innerText = "Մայնինգը կանգնեցված է";
                document.getElementById('hash-rate').innerText = "0.00 TH/s";
                document.getElementById('timer').innerText = "15s";
            }
        }