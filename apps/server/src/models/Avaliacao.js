import mongoose from 'mongoose';

const avaliacaoSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      unique: true,
    },
    satisfacaoGeral: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    navegacao: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    avaliacaoProjeto: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    ajudaViagem: {
      type: String,
      default: '',
      trim: true,
    },
    sugestoes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'avaliacoes',
  }
);

export default mongoose.models.Avaliacao || mongoose.model('Avaliacao', avaliacaoSchema);