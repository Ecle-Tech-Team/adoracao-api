import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import express from 'express';
import db from '../src/repository/connection.js';
import igrejaRouter from '../src/controllers/igrejacontroller.js';
import groupService from '../src/services/gruposervices.js';
import { normalizeChurchName } from '../src/services/igrejaservices.js';
import loginRouter from '../src/controllers/logincontroller.js';
import { hashPassword } from '../src/services/passwords.js';

process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters-long';

for (const name of ['Igreja Batista Central', 'IGREJA BATISTA CENTRAL', '  Igreja   Batista   Central ']) {
  test(`normalizes ${name}`, () => assert.equal(normalizeChurchName(name), 'igreja batista central'));
}
test('normalizes accents', () => assert.equal(normalizeChurchName('Igreja São José'), 'igreja sao jose'));

async function request(router, path, options) {
  const app = express();
  app.use(express.json(), router);
  const server = app.listen(0);
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, options);
    const body = await response.text();
    return { status: response.status, json: async () => JSON.parse(body) };
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

test('creates a church with normalized name and state', async () => {
  const calls = [];
  mock.method(db, 'connect', async () => ({
    query: async (sql, params) => {
      calls.push({ sql, params });
      return sql.startsWith('SELECT') ? [[]] : [{ insertId: 10 }];
    }, end: async () => {},
  }));
  try {
    const response = await request(igrejaRouter, '/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Igreja Batista Central', cidade: 'São Paulo', estado: 'sp' }),
    });
    assert.equal(response.status, 201);
    assert.deepEqual((({ estado, nome_normalizado }) => ({ estado, nome_normalizado }))(await response.json()),
      { estado: 'SP', nome_normalizado: 'igreja batista central' });
    assert.equal(calls[1].params[1], 'igreja batista central');
    assert.equal(calls[1].params[3], 'SP');
  } finally { mock.restoreAll(); }
});

test('rejects missing and empty names', async () => {
  for (const body of [{}, { nome: '  ' }]) {
    const response = await request(igrejaRouter, '/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    assert.equal(response.status, 400);
  }
});

test('searches with normalized term and caps results', async () => {
  let params;
  mock.method(db, 'connect', async () => ({
    query: async (_sql, values) => { params = values; return [[{ id_igreja: 10 }]]; },
    end: async () => {},
  }));
  try {
    const response = await request(igrejaRouter, '/?search=BÁTISta&limit=500');
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(await response.json()));
    assert.deepEqual(params, ['batista', '%batista%', '%batista%', 20]);
  } finally { mock.restoreAll(); }
});

test('group creation uses the authenticated user church, including legacy null', async () => {
  for (const churchId of [10, null]) {
    let inserted;
    const conn = {
      beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, end: async () => {},
      query: async (sql, params) => {
        if (sql.startsWith('SELECT id_usuario')) return [[{ id_usuario: 1, tipo_usuario: 'Adorador', id_grupo: null, id_igreja: churchId }]];
        if (sql.startsWith('SELECT regente_id')) return [[{ regente_id: 3 }]];
        if (sql.startsWith('SELECT id FROM grupo')) return [[]];
        if (sql.startsWith('INSERT INTO grupo')) { inserted = params; return [{ insertId: 5 }]; }
        return [{}];
      },
    };
    mock.method(db, 'connect', async () => conn);
    try {
      assert.equal(await groupService.createGroup('Grupo', 'Local', 'Louvor', 1), 5);
      assert.equal(inserted[4], churchId);
    } finally { mock.restoreAll(); }
  }
});

test('login includes associated church and null for legacy users', async () => {
  const senha = await hashPassword('password123');
  for (const churchId of [10, null]) {
    mock.method(db, 'connect', async () => ({
      query: async (sql) => sql.startsWith('SELECT id_usuario')
        ? [[{ id_usuario: 1, nome: 'Pessoa', email: 'p@example.com', senha, tipo_usuario: 'Adorador', id_grupo: null, id_igreja: churchId }]]
        : [{}],
      end: async () => {},
    }));
    try {
      const response = await request(loginRouter, '/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'p@example.com', password: 'password123', clientType: 'mobile' }),
      });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).id_igreja, churchId);
    } finally { mock.restoreAll(); }
  }
});
