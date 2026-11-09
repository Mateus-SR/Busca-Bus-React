const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function pedir(caminho, opcoes) {
	let resposta;
	try {
		resposta = await fetch(`${API_URL}${caminho}`, opcoes);
	} catch {
		throw new Error('Não foi possível falar com o servidor. Tente de novo em instantes.');
	}

	const dados = await resposta.json().catch(() => ({}));
	if (!resposta.ok) throw new Error(dados.erro || 'Algo deu errado. Tente de novo.');
	return dados;
}

export const listarEventos = () => pedir('/v1/eventos').then((dados) => dados.eventos);

export const listarFatecs = () => pedir('/v1/fatecs').then((dados) => dados.fatecs);

export const criarEvento = (token, evento) =>
	pedir('/v1/eventos', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify(evento),
	}).then((dados) => dados.evento);