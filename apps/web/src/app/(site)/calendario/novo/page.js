'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ehAdmin, LOCAIS_COM_NUMERO, LOCAIS_EVENTO, TIPOS_EVENTO } from '@busca-bus/core';import { useAuth } from '@/contexts/AuthContext';
import { criarEvento, listarFatecs } from '@/lib/eventosApi';
import { CORES_EVENTO, dataPorExtenso, horaCurta } from '@/utils/calendario';

const FORMULARIO_VAZIO = {
	tipo: '',
	titulo: '',
	data: '',
	inicio: '',
	fim: '',
	local: '',
	numeroLocal: '',
	descricao: '',
	facId: '',
};

const estiloCampo =
	'border-borda focus:ring-foco w-full rounded-md border px-4 py-3 text-lg focus:ring-2 focus:outline-none';
const estiloRotulo = 'text-texto-suave mb-2 block text-sm font-medium';

function Aviso({ titulo, texto, href, botao }) {
	return (
		<main className="font-inter flex min-h-[60vh] items-center justify-center px-4 py-10">
			<section className="border-borda bg-superficie w-full max-w-lg rounded-2xl border p-6 text-center shadow-lg sm:p-8">
				<h1 className="text-texto mb-3 text-2xl font-extrabold">{titulo}</h1>
				<p className="text-texto-suave mb-6">{texto}</p>
				<Link
					href={href}
					className="bg-destaque text-sobre-destaque hover:bg-destaque-forte inline-flex rounded-xl px-5 py-3 font-bold transition"
				>
					{botao}
				</Link>
			</section>
		</main>
	);
}

export default function NovoEventoPage() {
	const { usuario, estaLogado, carregando, accessToken } = useAuth();
	const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
	const [fatecs, setFatecs] = useState([]);
	const [enviando, setEnviando] = useState(false);
	const [erro, setErro] = useState('');
	const [criado, setCriado] = useState(null);

	useEffect(() => {
		listarFatecs()
			.then(setFatecs)
			.catch(() => {});
	}, []);

	if (carregando) return <main className="min-h-[60vh]" />;

	if (!estaLogado) {
		return (
			<Aviso
				titulo="Novo evento"
				texto="Faça login para criar eventos."
				href="/login"
				botao="Entrar"
			/>
		);
	}

	if (!ehAdmin(usuario?.role)) {
		return (
			<Aviso
				titulo="Acesso restrito"
				texto="Apenas administradores podem criar eventos."
				href="/calendario"
				botao="Voltar ao calendário"
			/>
		);
	}

	const facId = formulario.facId || usuario?.fac_id || '';
	const corDoTipo = TIPOS_EVENTO.find((tipo) => tipo.valor === formulario.tipo)?.cor;

	const atualizar = (campo, valor) => setFormulario((atual) => ({ ...atual, [campo]: valor }));
	const pedeNumero = LOCAIS_COM_NUMERO.includes(formulario.local);

	async function enviar(e) {
		e.preventDefault();
		setErro('');

		const inicio = new Date(`${formulario.data}T${formulario.inicio}`);
		const fim = new Date(`${formulario.data}T${formulario.fim}`);
		if (fim <= inicio) {
			setErro('O horário de término deve ser depois do início.');
			return;
		}

		setEnviando(true);
		try {
			const evento = await criarEvento(accessToken, {
				tipo: formulario.tipo,
				titulo: formulario.titulo,
				inicio: inicio.toISOString(),
				fim: fim.toISOString(),
				local: pedeNumero ? `${formulario.local} ${formulario.numeroLocal.trim()}` : formulario.local,				descricao: formulario.descricao,
				fac_id: facId,
			});
			setCriado(evento);
			setFormulario(FORMULARIO_VAZIO);
		} catch (err) {
			setErro(err.message);
		} finally {
			setEnviando(false);
		}
	}

	if (criado) {
		const inicio = new Date(criado.inicio);
		const fim = new Date(criado.fim);
		return (
			<main className="font-inter flex min-h-[60vh] items-center justify-center px-4 py-10">
				<section
					role="status"
					className="border-borda bg-superficie w-full max-w-lg rounded-2xl border p-6 text-center shadow-lg sm:p-8"
				>
					<h1 className="text-texto mb-2 text-2xl font-extrabold">Evento criado!</h1>
					<p className="text-texto font-semibold">
						{criado.tipo}: {criado.titulo}
					</p>
					<p className="text-texto-suave mt-1 text-sm">
						{dataPorExtenso(inicio)} · {horaCurta(inicio)} às {horaCurta(fim)} · {criado.local}
					</p>
					<div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
						<Link
							href="/calendario"
							className="bg-destaque text-sobre-destaque hover:bg-destaque-forte rounded-xl px-5 py-3 font-bold transition"
						>
							Ver no calendário
						</Link>
						<button
							type="button"
							onClick={() => setCriado(null)}
							className="border-borda cursor-pointer rounded-xl border-2 px-5 py-3 font-bold transition hover:bg-gray-100"
						>
							Criar outro evento
						</button>
					</div>
				</section>
			</main>
		);
	}

	return (
		<main className="font-inter px-4 py-8 sm:px-6 sm:py-10">
			<div className="mx-auto w-full max-w-xl">
				<Link
					href="/calendario"
					className="text-texto hover:text-destaque text-sm transition hover:underline"
				>
					← Voltar ao calendário
				</Link>
				<h1 className="text-texto mt-3 mb-8 text-3xl font-extrabold">Novo evento</h1>

				<form onSubmit={enviar} className="space-y-6">
					<div>
						<label htmlFor="tipo" className={estiloRotulo}>
							Tipo de evento
						</label>
						<div className="flex items-center gap-3">
							<span
								aria-hidden="true"
								className={`h-5 w-5 shrink-0 rounded-sm ${corDoTipo ? CORES_EVENTO[corDoTipo] : 'bg-gray-200'}`}
							/>
							<select
								id="tipo"
								required
								value={formulario.tipo}
								onChange={(e) => atualizar('tipo', e.target.value)}
								className={estiloCampo}
							>
								<option value="" disabled>
									Selecione
								</option>
								{TIPOS_EVENTO.map((tipo) => (
									<option key={tipo.valor} value={tipo.valor}>
										{tipo.valor}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label htmlFor="titulo" className={estiloRotulo}>
							Título do evento
						</label>
						<input
							id="titulo"
							type="text"
							required
							maxLength={80}
							value={formulario.titulo}
							onChange={(e) => atualizar('titulo', e.target.value)}
							placeholder="Palestra de Gestão"
							className={estiloCampo}
						/>
					</div>

					<div>
						<label htmlFor="data" className={estiloRotulo}>
							Data
						</label>
						<input
							id="data"
							type="date"
							required
							value={formulario.data}
							onChange={(e) => atualizar('data', e.target.value)}
							className={estiloCampo}
						/>
					</div>

					<fieldset>
						<legend className={estiloRotulo}>Horário (entre 07:00 e 23:00)</legend>
						<div className="flex items-center gap-3">
							<input
								type="time"
								required
								min="07:00"
								max="23:00"
								aria-label="Horário de início"
								value={formulario.inicio}
								onChange={(e) => atualizar('inicio', e.target.value)}
								className={estiloCampo}
							/>
							<span className="text-texto-suave">às</span>
							<input
								type="time"
								required
								min="07:00"
								max="23:00"
								aria-label="Horário de término"
								value={formulario.fim}
								onChange={(e) => atualizar('fim', e.target.value)}
								className={estiloCampo}
							/>
						</div>
					</fieldset>

					<div>
						<label htmlFor="local" className={estiloRotulo}>
							Local do evento
						</label>
						<select
							id="local"
							required
							value={formulario.local}
							onChange={(e) => atualizar('local', e.target.value)}
							className={estiloCampo}
						>
							<option value="" disabled>
								Selecione
							</option>
							{LOCAIS_EVENTO.map((local) => (
								<option key={local} value={local}>
									{local}
								</option>
							))}
						</select>
					</div>

										{pedeNumero && (
						<div>
							<label htmlFor="numeroLocal" className={estiloRotulo}>
								{formulario.local === 'Laboratório' ? 'Número do laboratório' : 'Número da sala'}
							</label>
							<input
								id="numeroLocal"
								type="text"
								required
								maxLength={10}
								value={formulario.numeroLocal}
								onChange={(e) => atualizar('numeroLocal', e.target.value)}
								placeholder="201"
								className={estiloCampo}
							/>
						</div>
					)}

					<div>
						<label htmlFor="descricao" className={estiloRotulo}>
							Descrição
						</label>
						<textarea
							id="descricao"
							required
							rows={4}
							maxLength={500}
							value={formulario.descricao}
							onChange={(e) => atualizar('descricao', e.target.value)}
							placeholder="Sobre o que é o evento? Quem vai apresentar?"
							className={estiloCampo}
						/>
					</div>

					<div>
						<label htmlFor="fatec" className={estiloRotulo}>
							Fatec
						</label>
						<select
							id="fatec"
							required
							value={facId}
							onChange={(e) => atualizar('facId', e.target.value)}
							className={estiloCampo}
						>
							<option value="" disabled>
								Selecione
							</option>
							{fatecs.map((fatec) => (
								<option key={fatec.id_fac} value={fatec.id_fac}>
									{fatec.nome_fac}
								</option>
							))}
						</select>
					</div>

					{erro && (
						<p role="alert" className="text-erro text-center text-sm font-semibold">
							{erro}
						</p>
					)}

					<button
						type="submit"
						disabled={enviando}
						className="bg-destaque text-sobre-destaque hover:bg-destaque-forte w-full cursor-pointer rounded-md px-4 py-3 text-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
					>
						{enviando ? 'Criando...' : 'Criar evento'}
					</button>
				</form>
			</div>
		</main>
	);
}