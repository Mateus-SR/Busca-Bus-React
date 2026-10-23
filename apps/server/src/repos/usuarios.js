import { Usuario } from "./models/Usuario.js";

export function criarUsuariosRepo() {
  return {
    disponivel: true,

    async porEmail(email) {
      return Usuario.findOne({
        email: email.toLowerCase().trim(),
      });
    },

    async criar(usuario) {
      const novoUsuario = await Usuario.create(usuario);
      return novoUsuario.toObject();
    },
  };
}