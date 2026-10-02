# Igrejas e conteúdo futuro

`igrejas.id_igreja` identifica a igreja no MySQL. `usuarios.id_igreja` e
`grupo.id_igreja` aceitam NULL durante a migração; o texto legado
`usuarios.igreja` permanece intacto e não é convertido automaticamente.
Aplicar `migration_igrejas.sql` uma vez no banco existente antes de implantar
o código que consulta as novas colunas. O esquema de inicialização local já
inclui a estrutura. O rollback remove os vínculos e a tabela, então só deve
ser usado após preservar eventuais dados criados.

Ao criar grupos, a API consulta `usuarios.id_igreja` na transação e grava esse
valor em `grupo`. Usuários antigos com NULL continuam podendo criar grupos
legados. O JWT carrega apenas usuário e sessão; o banco é a fonte de verdade
para igreja, inclusive após uma associação mudar. A resposta de `/auth/me` e
do login inclui `id_igreja` para os clientes.

No futuro, a UX pode chamar os hinários editoriais ou de domínio público de
**Hinários** (Harpa Cristã, CCB e outros permitidos) e o conteúdo criado por
usuários de **Hinos da Igreja**. Os hinários existentes continuam no MongoDB;
uma futura coleção `hinos_igreja` poderá usar `id_igreja` como escopo. Cada
operação futura de leitura ou escrita desse conteúdo deve derivar a igreja do
usuário autenticado pelo banco e filtrar por ela. Nunca autorizar por um
`id_igreja` arbitrário enviado por query ou corpo. O cadastro de igrejas nesta
fase não associa o usuário a uma igreja; essa ação pertence ao onboarding
futuro e precisará de autorização própria.

## Verificação manual após aplicar a migration

Com API e bancos locais em execução, usar `curl` ou cliente HTTP:

```powershell
$base = 'http://localhost:3333'
$church = Invoke-RestMethod -Method Post -Uri "$base/igrejas" -ContentType 'application/json' -Body '{"nome":"Igreja Batista Central","cidade":"São Paulo","estado":"SP"}'
Invoke-RestMethod -Uri "$base/igrejas"
Invoke-RestMethod -Uri "$base/igrejas?search=batista"
$login = Invoke-RestMethod -Method Post -Uri "$base/login" -ContentType 'application/json' -Body '{"email":"USUARIO_TESTE","password":"SENHA_TESTE","clientType":"mobile"}'
$login.id_igreja
Invoke-RestMethod -Method Post -Uri "$base/grupo" -Headers @{ Authorization = "Bearer $($login.token)" } -ContentType 'application/json' -Body '{"name":"Grupo de teste","local":"Sala","typeGroup":"Louvor","id_igreja":999}'
```

Use um usuário de teste ainda sem grupo para a última requisição. Os passos
abaixo incluem as verificações SQL e no dispositivo.

1. `POST /igrejas` com `{"nome":"Igreja Batista Central","cidade":"São Paulo","estado":"SP"}` deve retornar 201.
2. `GET /igrejas` deve retornar 200; `GET /igrejas?search=batista` deve encontrar o registro.
3. No banco de teste, associar explicitamente um usuário: `UPDATE usuarios SET id_igreja = <id> WHERE id_usuario = <usuario_teste>`; conferir com `SELECT id_igreja FROM usuarios WHERE id_usuario = <usuario_teste>`.
4. Logar e conferir `id_igreja` na resposta. Um usuário com NULL deve continuar logando.
5. No mobile, conferir `id_user`, `id_grupo`, `id_igreja` no AuthContext; reiniciar o app e conferir restauração. Logout deve limpar o perfil persistido.
6. Criar grupo com o usuário associado e conferir `SELECT id_igreja FROM grupo WHERE id = <novo_grupo>`; o valor deve ser o do usuário mesmo se o corpo da requisição contiver outro `id_igreja`.
