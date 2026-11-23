export const UBS_LISTA = [
  { codigo: 'centro', nome: 'UBS Centro' },
  { codigo: 'vilanova', nome: 'UBS Vila Nova' },
  { codigo: 'jardim', nome: 'UBS Jardim América' },
  { codigo: 'saojose', nome: 'UBS São José' },
  { codigo: 'parqueflores', nome: 'UBS Parque das Flores' },
];

export const ESPECIALIDADES = [
  { id: 'clinico', nome: 'Clínico geral', descricao: 'Consulta de rotina, renovação de receita e acompanhamento.' },
  { id: 'enfermagem', nome: 'Enfermagem', descricao: 'Curativo, pressão, glicemia e vacinas.' },
  { id: 'odonto', nome: 'Odontologia', descricao: 'Avaliação e tratamento dentário.' },
  { id: 'gineco', nome: 'Ginecologia', descricao: 'Preventivo e saúde da mulher.' },
  { id: 'pediatria', nome: 'Pediatria', descricao: 'Crianças de 0 a 12 anos.' },
];

export const nomeUbs = (codigo: string) => UBS_LISTA.find((u) => u.codigo === codigo)?.nome ?? codigo;
export const nomeEspecialidade = (id: string) => ESPECIALIDADES.find((e) => e.id === id)?.nome ?? id;
