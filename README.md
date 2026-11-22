# UBS Agora: APIs Node

Três APIs simples (**NestJS + Prisma + PostgreSQL**) com dados mockados, para o app Ruby consumir.
Todas respondem JSON direto (arrays/objetos, sem paginação).

| API | Porta | Swagger |
|---|---|---|
| Farmácia | 3001 | http://localhost:3001/docs |
| Agendamento | 3002 | http://localhost:3002/docs |
| Fila | 3003 | http://localhost:3003/docs |

## Subir

```bash
docker compose up -d --build
```

Na primeira subida cada API cria as tabelas e popula os dados mockados.
Para recriar tudo do zero: `docker compose down -v && docker compose up -d --build`.

## Endpoints

### Farmácia: consulta de estoque
| Método | Rota | |
|---|---|---|
| GET | `/v1/medicamentos` | todos os medicamentos |
| GET | `/v1/medicamentos?nome=amox` | busca por parte do nome (ignora maiúsculas) |

```json
[{ "id": 5, "nome": "Amoxicilina", "concentracao": "500 mg", "forma": "Cápsula", "quantidade": 410, "disponivel": true }]
```

### Fila: movimento da UBS hoje
| Método | Rota | |
|---|---|---|
| GET | `/v1/movimento` | todas as UBS com o indicador |
| GET | `/v1/movimento/:ubsId` | uma UBS (404 se não existir) |

`movimento` é `Baixo` (até 10 pessoas), `Médio` (até 25) ou `Alto` (mais de 25).

```json
{ "id": 1, "nome": "UBS Centro", "endereco": "Rua XV de Novembro, 120", "pessoasNaFila": 32, "movimento": "Alto" }
```

### Agendamento: horários e consultas
| Método | Rota | |
|---|---|---|
| GET | `/v1/horarios` | horários livres a partir de agora. Filtros opcionais: `data=YYYY-MM-DD`, `especialidade=pediatria` |
| POST | `/v1/agendamentos` | `{ horarioId, pacienteNome, pacienteCns }` → **201** com o comprovante, **409** se o horário já foi ocupado, **400** se os dados forem inválidos |

Comprovante:
```json
{
  "protocolo": "UBS-000001",
  "pacienteNome": "Maria da Silva",
  "pacienteCns": "700000000000001",
  "dataHora": "2026-11-23T11:00:00.000Z",
  "ubs": "UBS Centro",
  "profissional": "Dra. Ana Souza",
  "especialidade": "Clínica Geral",
  "agendadoEm": "2026-11-22T18:10:00.000Z"
}
```

Datas das respostas vêm em ISO-8601 UTC (no Ruby: `Time.parse(x).localtime("-03:00")`).

## Exemplo em Ruby

```ruby
require "net/http"
require "json"

def get(url)
  JSON.parse(Net::HTTP.get(URI(url)))
end

# Estoque
get("http://localhost:3001/v1/medicamentos?nome=dipirona").each do |m|
  puts "#{m['nome']} #{m['concentracao']}: #{m['disponivel'] ? m['quantidade'] : 'em falta'}"
end

# Movimento
ubs = get("http://localhost:3003/v1/movimento/1")
puts "#{ubs['nome']}: movimento #{ubs['movimento']}"

# Horários e agendamento
horario = get("http://localhost:3002/v1/horarios?especialidade=pediatria").first
res = Net::HTTP.post(URI("http://localhost:3002/v1/agendamentos"),
                     { horarioId: horario["id"], pacienteNome: "Maria", pacienteCns: "700000000000001" }.to_json,
                     "Content-Type" => "application/json")
comprovante = JSON.parse(res.body) if res.code == "201"
```

## Desenvolvimento local (sem Docker para as APIs)

```bash
npm run db:up && npm run install:all && npm run setup
cd apps/farmacia && npm run start:dev
```

Estrutura de cada API: `src/controllers` (HTTP) → `src/services` (regra) → `src/repositories` (Prisma), `src/schemas` (validação do corpo), `prisma/` (schema, migration e seed).
