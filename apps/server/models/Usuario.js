
import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    senhaHash: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "usuario",
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    fac_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    collection: "Users",
    versionKey: false,
  }
);

export const Usuario =
  mongoose.models.Usuario ||
  mongoose.model("Usuario", usuarioSchema);
