# Colony OS: arquitetura autonoma

## Objetivo

Transformar a colonia em um sistema orientado por demanda, capaz de sobreviver,
medir gargalos, ajustar a forca de trabalho e evoluir sem intervencao manual.
Cada decisao importante deve ser observavel em `Memory.telemetry`.

## Principios

1. Sobrevivencia antes de crescimento.
2. Energia para spawn e defesa antes de controller e obras.
3. Decisoes baseadas em capacidade, distancia e demanda, nao apenas em RCL.
4. Nenhuma expansao sem reserva economica e capacidade de defesa.
5. Mudancas graduais, reversiveis e medidas por telemetria.

## Estados operacionais

- `RECOVERY`: nenhum minerador ou energia critica; cria corpos minimos.
- `STABILIZE`: recompõe mineracao e logistica ate fluxo sustentavel.
- `BUILD`: executa infraestrutura prioritaria com limite de obras.
- `GROW`: converte excedente em progresso do controller.
- `DEFEND`: hostis suspendem gastos nao essenciais e priorizam defesa.
- `EXPAND`: reserva energia e prepara uma nova sala quando os criterios forem atendidos.

## Subsistemas

### Kernel

- Executa os subsistemas com orcamento de CPU.
- Registra erros sem derrubar todo o tick.
- Reduz tarefas opcionais quando o bucket estiver baixo.

### Economia

- Mede energia minerada, transportada, consumida e desperdicada.
- Calcula renda por tick, custo de reposicao e saldo operacional.
- Seleciona o estado operacional da colonia.

### Workforce

- Substitui metas fixas por demanda de partes `WORK`, `CARRY` e `MOVE`.
- Preve morte de creeps usando TTL e tempo de spawn/viagem.
- Dimensiona corpos para capacidade, terreno e distancia.

### Mineracao e logistica

- Um minerador dedicado por fonte e posicao persistente.
- Containers junto das fontes.
- Transportadores dimensionados por producao e distancia.
- Reserva de alvos para evitar varios creeps disputando a mesma tarefa.

### Fila de tarefas

- Prioridades globais: emergencia, defesa, spawn, torre, infraestrutura,
  manutencao e controller.
- Tarefas com reserva, prazo e valor economico.
- Reatribuicao automatica quando um alvo desaparece ou fica inacessivel.

### Planejamento

- Layout persistente e validado contra terreno e estruturas existentes.
- Estradas baseadas em trafego real.
- Containers, torre, storage, links e defesas planejados por RCL.
- Limite dinamico de obras conforme a capacidade dos builders.

### Defesa

- Classificacao de ameacas por partes ativas.
- Foco de torres, cura e reparo de ramparts.
- Estado `DEFEND`, alertas e registro de incidentes.

### Inteligencia e expansao

- Scouting de salas vizinhas.
- Pontuacao por fontes, mineral, distancia, terreno e risco.
- Claim somente com economia, GCL e reserva suficientes.

### Telemetria e controle

- Historico de energia, CPU, bucket, RCL, populacao e spawn.
- Metricas de throughput por papel e por fonte.
- Eventos de nascimento, morte, defesa, mudanca de estado e erro.
- Alertas para energia critica, controller, bucket, reposicao e creeps ociosos.

## Fases de entrega

### Fase 1 - Observabilidade e resiliencia

- Estado operacional explicito.
- Telemetria de TTL, spawn, fontes, obras e utilizacao.
- Reposicao antecipada e recuperacao garantida.
- Criterio: zero colapsos e bucket estavel por 24 horas.

### Fase 2 - Economia orientada por demanda

- Mineradores dedicados, containers e transportadores.
- Populacao calculada por distancia e throughput.
- Criterio: fontes exploradas com baixo desperdicio e spawn abastecido.

### Fase 3 - Tarefas e infraestrutura

- Fila de trabalho, reparos e layout persistente.
- Planejamento por RCL sem inundar construction sites.
- Criterio: backlog previsivel e infraestrutura mantida.

### Fase 4 - Defesa e expansao

- Avaliacao de ameaca, ramparts e scouting.
- Expansao condicionada por metricas economicas.
- Criterio: defesa autonoma e novas salas sem comprometer a origem.

## Janela de avaliacao

- 30 minutos: falhas funcionais e recuperacao.
- 2 a 4 horas: fluxo de energia e dimensionamento inicial.
- 24 horas: reposicao, CPU, obras e progresso sustentado.
- 3 a 7 dias: calibracao, defesa e decisao de expansao.

## Regra de promocao

Uma fase so avanca quando seus criterios ficam estaveis na telemetria. Se uma
mudanca piorar renda, disponibilidade do spawn, bucket ou sobrevivencia, o bot
volta ao comportamento anterior e o diagnostico e registrado.
