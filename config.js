// Configuração do Assessor · Horn Films
// Sem Firebase (firebase: null) o app funciona em "modo local".
window.ASSESSOR_CONFIG = {
  firebase: {
    apiKey: "AIzaSyB6twEOUY5vj3FQkJJaw1VCfn5FkhTxfTY",
    authDomain: "assessor-horn.firebaseapp.com",
    projectId: "assessor-horn",
    storageBucket: "assessor-horn.firebasestorage.app",
    messagingSenderId: "297688812408",
    appId: "1:297688812408:web:e4166099977658512a168d"
  },

  // Cada conta Google só enxerga os próprios dados (regras do Firestore).
  // Para travar o acesso em contas específicas, liste os e-mails aqui. Ex.: ["voce@gmail.com"]
  allowedEmails: []
};
