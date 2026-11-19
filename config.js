// Configuração do Assessor · Horn Films
// 1) Sem Firebase (firebase: null) o app funciona em "modo local": os dados ficam só no aparelho/navegador.
// 2) Para sincronizar celular + computador, crie um projeto no Firebase (passo a passo no README.md)
//    e cole aqui o objeto firebaseConfig que o Firebase mostra.
window.ASSESSOR_CONFIG = {
  firebase: null,
  /* Exemplo:
  firebase: {
    apiKey: "AIza...",
    authDomain: "assessor-horn.firebaseapp.com",
    projectId: "assessor-horn",
    storageBucket: "assessor-horn.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:xxxxxxxxxxxx"
  },
  */

  // Só estes e-mails conseguem entrar (deixe [] para qualquer conta Google, cada uma com seus próprios dados)
  allowedEmails: []
};
