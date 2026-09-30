import db from '../repository/connection.js';

export function normalizeChurchName(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

const clean = (value) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : null;

export function churchInput(body) {
  const nome = clean(body?.nome);
  const cidade = clean(body?.cidade) || null;
  const estado = clean(body?.estado)?.toUpperCase() || null;
  const endereco = clean(body?.endereco) || null;
  const cep = clean(body?.cep) || null;
  if (!nome || nome.length > 150 || !normalizeChurchName(nome) ||
      (cidade && cidade.length > 100) || (estado && !/^[A-Z]{2}$/.test(estado)) ||
      (endereco && endereco.length > 255) || (cep && !/^\d{5}-?\d{3}$/.test(cep))) {
    const error = new Error('Dados da igreja inválidos.');
    error.code = 'INVALID_CHURCH_DATA';
    throw error;
  }
  return { nome, nome_normalizado: normalizeChurchName(nome), cidade, estado, endereco, cep };
}

export async function createIgreja(body) {
  const input = churchInput(body);
  const conn = await db.connect();
  try {
    const [existing] = await conn.query(
      'SELECT id_igreja FROM igrejas WHERE nome_normalizado = ? AND LOWER(COALESCE(cidade, \'\')) = LOWER(COALESCE(?, \'\')) AND estado <=> ? LIMIT 1',
      [input.nome_normalizado, input.cidade, input.estado]
    );
    if (existing.length) {
      const error = new Error('Igreja já cadastrada nesta cidade e estado.');
      error.code = 'CHURCH_ALREADY_EXISTS';
      throw error;
    }
    const [result] = await conn.query(
      'INSERT INTO igrejas (nome, nome_normalizado, cidade, estado, endereco, cep) VALUES (?, ?, ?, ?, ?, ?)',
      [input.nome, input.nome_normalizado, input.cidade, input.estado, input.endereco, input.cep]
    );
    return { id_igreja: result.insertId, ...input };
  } finally { await conn.end(); }
}

export async function listIgrejas(search = '', limit = 20) {
  const conn = await db.connect();
  try {
    const term = normalizeChurchName(search);
    const like = `%${term}%`;
    const [rows] = await conn.query(
      `SELECT id_igreja, nome, cidade, estado FROM igrejas WHERE ativa = TRUE
       AND (? = '' OR nome_normalizado LIKE ? OR LOWER(cidade) LIKE ?)
       ORDER BY nome LIMIT ?`, [term, like, like, limit]
    );
    return rows;
  } finally { await conn.end(); }
}

export async function getIgreja(id) {
  const conn = await db.connect();
  try {
    const [rows] = await conn.query(
      'SELECT id_igreja, nome, cidade, estado, endereco, cep, ativa FROM igrejas WHERE id_igreja = ?', [id]
    );
    return rows[0] || null;
  } finally { await conn.end(); }
}
