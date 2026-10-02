import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import express from 'express';
import { ObjectId } from 'mongodb';
import db from '../src/repository/connection.js';
import router from '../src/controllers/churchSongController.js';
import { fetchHinos, fetchHinosGeralController } from '../src/controllers/hinoscontroller.js';
import { normalizeSongTitle, extractYouTubeVideoId } from '../src/helpers/churchSongs.js';
import { generateToken } from '../src/helpers/userFeatures.js';
import { verifyJWT } from '../src/middlewares/jwt.js';

process.env.JWT_SECRET = 'church-song-test-secret-with-at-least-32-chars';

test('title normalization', () => {
  assert.equal(normalizeSongTitle('Grande É o Senhor'), 'grande e o senhor');
  assert.equal(normalizeSongTitle('  GRANDE   É O SENHOR  '), 'grande e o senhor');
});

test('legacy hinario routes remain available', async () => {
  const names = [];
  mock.method(db, 'connectMongoDB', async () => ({ client: { close: async () => {} }, db: { collection: name => { names.push(name); return { find: () => ({ toArray: async () => [] }) }; } } }));
  const app = express(); const legacy = express.Router(); legacy.get('/hinario', fetchHinosGeralController); legacy.get('/hinos/:hinario', fetchHinos); app.use(legacy);
  const server = app.listen(0);
  try {
    for (const path of ['/hinario', '/hinos/harpa_crista', '/hinos/ccb']) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`);
      assert.equal(response.status, 200, path);
      assert.deepEqual(await response.json(), []);
    }
    assert.equal(names.length, 3);
  } finally { mock.restoreAll(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
test('YouTube URL validation', () => {
  for (const url of ['https://www.youtube.com/watch?v=abc123', 'https://youtu.be/abc123', 'https://www.youtube.com/embed/abc123', 'https://www.youtube.com/shorts/abc123']) assert.equal(extractYouTubeVideoId(url), 'abc123');
  assert.equal(extractYouTubeVideoId('https://google.com/abc123'), null);
  assert.equal(extractYouTubeVideoId('https://youtube.com.evil.test/watch?v=abc123'), null);
});

test('HTTP CRUD, search, soft delete and tenant isolation', async () => {
  const records = [];
  let church = 10;
  const matches = (doc, filter) => Object.entries(filter).every(([key, value]) => String(doc[key]) === String(value));
  const collection = {
    find(filter) {
      let found = records.filter(doc => matches(doc, filter));
      return { sort() { return this; }, project() { return this; }, limit(n) { found = found.slice(0, n); return this; }, async toArray() { return found; } };
    },
    async findOne(filter) { return records.find(doc => matches(doc, filter)) ?? null; },
    async insertOne(doc) { doc._id = new ObjectId(); records.push(doc); return { insertedId: doc._id }; },
    async findOneAndUpdate(filter, update) { const doc = records.find(row => matches(row, filter)); if (!doc) return null; Object.assign(doc, update.$set); return doc; },
    async updateOne(filter, update) { const doc = records.find(row => matches(row, filter)); if (!doc) return { matchedCount: 0 }; Object.assign(doc, update.$set); return { matchedCount: 1 }; },
  };
  mock.method(db, 'connect', async () => ({ query: async (sql, params) => sql.includes('FROM auth_sessions') ? [[{ id: 'session' }]] : [[{ id_usuario: Number(params[0]), id_igreja: Number(params[0]) || null }]], end: async () => {} }));
  mock.method(db, 'connectMongoDB', async () => ({ client: { close: async () => {} }, db: { collection: (name) => { assert.equal(name, 'hinos_igreja'); return collection; } } }));
  const app = express(); app.use(express.json()); app.use('/hinos-igreja', verifyJWT, router);
  const server = app.listen(0);
  const request = async (method, path, body) => { const res = await fetch(`http://127.0.0.1:${server.address().port}/hinos-igreja${path}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${generateToken(church, 'test-session')}` }, body: body && JSON.stringify(body) }); return { status: res.status, data: res.status === 204 ? null : await res.json() }; };
  try {
    let response = await request('POST', '', { titulo: 'Teste', letra: 'conteúdo', confirmacaoDireitos: false });
    assert.equal(response.status, 400); assert.equal(response.data.error, 'RIGHTS_CONFIRMATION_REQUIRED');
    response = await request('POST', '', { titulo: 'Grande É o Senhor', letra: 'Verso', confirmacaoDireitos: true, id_igreja: 20 });
    assert.equal(response.status, 201); const idA = response.data.song._id;
    assert.equal(response.data.song.id_igreja, 10); assert.equal(response.data.song.direitos.confirmacaoUsuario, true);
    response = await request('POST', '', { titulo: '  GRANDE É O SENHOR  ', youtubeUrl: 'https://youtu.be/abc123' });
    assert.equal(response.data.possibleDuplicate, true);
    church = 20;
    response = await request('POST', '', { titulo: 'Hino B', id_igreja: 10 });
    const idB = response.data.song._id; assert.equal(response.data.song.id_igreja, 20);
    church = 10;
    response = await request('GET', '?search=grande&id_igreja=20'); assert.equal(response.data.length, 2);
    response = await request('GET', ''); assert.equal(response.data.length, 2);
    response = await request('GET', `/${idB}`); assert.equal(response.status, 404);
    response = await request('PUT', `/${idB}`, { titulo: 'Invasão' }); assert.equal(response.status, 404);
    response = await request('DELETE', `/${idB}`); assert.equal(response.status, 404);
    response = await request('GET', `/${idA}`); assert.equal(response.status, 200);
    response = await request('PUT', `/${idA}`, { titulo: 'Novo título', letra: 'Nova letra' }); assert.equal(response.status, 400); assert.equal(response.data.error, 'RIGHTS_CONFIRMATION_REQUIRED');
    response = await request('PUT', `/${idA}`, { titulo: 'Novo título', letra: 'Nova letra', confirmacaoDireitos: true }); assert.equal(response.status, 200);
    response = await request('DELETE', `/${idA}`); assert.equal(response.status, 204);
    response = await request('GET', `/${idA}`); assert.equal(response.status, 404);
    assert.equal(records.find(row => String(row._id) === idA).status, 'removido');
    church = 0;
    response = await request('GET', ''); assert.equal(response.status, 403); assert.equal(response.data.error, 'USER_WITHOUT_CHURCH');
  } finally { mock.restoreAll(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
