const ExcelJS = require('exceljs');
const path = require('path');

async function generateExcel() {
  const workbook = new ExcelJS.Workbook();

  // Dados de exemplo
  const convidados = [
    { 
      nomePrincipal: 'Ana Paula Ribeiro', 
      categoria: 'Adulto Pagante', 
      grupo: 'Família Ribeiro',
      email: 'ana.ribeiro@email.com',
      telefone: '(11) 91234-0001',
      status: 'Confirmado',
      confirmadoEm: '21/01/2026',
      acompanhante1: 'Rodrigo Ribeiro',
      categoriaAcomp1: 'Adulto Pagante',
      acompanhante2: 'Paula Ribeiro',
      categoriaAcomp2: 'Criança Pagante',
      acompanhante3: 'Lucas Ribeiro',
      categoriaAcomp3: 'Criança Não Pagante',
      acompanhante4: '',
      categoriaAcomp4: '',
      acompanhante5: '',
      categoriaAcomp5: ''
    },
    { 
      nomePrincipal: 'Carlos Ribeiro', 
      categoria: 'Adulto Pagante', 
      grupo: 'Família Ribeiro',
      email: 'carlos.ribeiro@email.com',
      telefone: '(11) 91234-0002',
      status: 'Pendente',
      confirmadoEm: '',
      acompanhante1: 'Fernanda Ribeiro',
      categoriaAcomp1: 'Adulto Pagante',
      acompanhante2: '',
      categoriaAcomp2: '',
      acompanhante3: '',
      categoriaAcomp3: '',
      acompanhante4: '',
      categoriaAcomp4: '',
      acompanhante5: '',
      categoriaAcomp5: ''
    },
    { 
      nomePrincipal: 'Mariana Ribeiro', 
      categoria: 'Criança Pagante', 
      grupo: 'Família Ribeiro',
      email: 'mariana.ribeiro@email.com',
      telefone: '(11) 91234-0003',
      status: 'Pendente',
      confirmadoEm: '',
      acompanhante1: '',
      categoriaAcomp1: '',
      acompanhante2: '',
      categoriaAcomp2: '',
      acompanhante3: '',
      categoriaAcomp3: '',
      acompanhante4: '',
      categoriaAcomp4: '',
      acompanhante5: '',
      categoriaAcomp5: ''
    },
    { 
      nomePrincipal: 'João Martins', 
      categoria: 'Adulto Pagante', 
      grupo: 'Família Martins',
      email: 'joao.martins@email.com',
      telefone: '(11) 91234-0004',
      status: 'Pendente',
      confirmadoEm: '',
      acompanhante1: 'Paula Martins',
      categoriaAcomp1: 'Adulto Pagante',
      acompanhante2: 'Sofia Martins',
      categoriaAcomp2: 'Criança Pagante',
      acompanhante3: 'Pedro Martins',
      categoriaAcomp3: 'Criança Não Pagante',
      acompanhante4: '',
      categoriaAcomp4: '',
      acompanhante5: '',
      categoriaAcomp5: ''
    }
  ];

  const confirmados = [
    { nome: 'Ana Paula Ribeiro', categoria: 'Adulto Pagante', grupo: 'Família Ribeiro' },
    { nome: 'Rodrigo Ribeiro', categoria: 'Adulto Pagante', grupo: 'Família Ribeiro' },
    { nome: 'Paula Ribeiro', categoria: 'Criança Pagante', grupo: 'Família Ribeiro' },
    { nome: 'Lucas Ribeiro', categoria: 'Criança Não Pagante', grupo: 'Família Ribeiro' },
  ];

  // ===== ABA 1: TODOS OS CONVIDADOS (COM ACOMPANHANTES) =====
  const ws1 = workbook.addWorksheet('Convidados');

  ws1.columns = [
    { header: 'Nome Principal', key: 'nomePrincipal', width: 20 },
    { header: 'Categoria', key: 'categoria', width: 15 },
    { header: 'Grupo', key: 'grupo', width: 18 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Telefone', key: 'telefone', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Confirmado Em', key: 'confirmadoEm', width: 12 },
    { header: 'Acompanhante 1', key: 'acompanhante1', width: 18 },
    { header: 'Categoria', key: 'categoriaAcomp1', width: 15 },
    { header: 'Acompanhante 2', key: 'acompanhante2', width: 18 },
    { header: 'Categoria', key: 'categoriaAcomp2', width: 15 },
    { header: 'Acompanhante 3', key: 'acompanhante3', width: 18 },
    { header: 'Categoria', key: 'categoriaAcomp3', width: 15 },
    { header: 'Acompanhante 4', key: 'acompanhante4', width: 18 },
    { header: 'Categoria', key: 'categoriaAcomp4', width: 15 },
    { header: 'Acompanhante 5', key: 'acompanhante5', width: 18 },
    { header: 'Categoria', key: 'categoriaAcomp5', width: 15 }
  ];

  // Formatação do header
  const headerRow1 = ws1.getRow(1);
  headerRow1.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  headerRow1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow1.height = 30;

  // Adicionar dados
  convidados.forEach((convidado, index) => {
    const row = ws1.addRow(convidado);
    row.font = { size: 10 };
    row.alignment = { horizontal: 'left', vertical: 'middle' };
    if ((index + 2) % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    }
  });

  // ===== ABA 2: CONVIDADOS CONFIRMADOS =====
  const ws2 = workbook.addWorksheet('Convidados Confirmados');

  ws2.columns = [
    { header: 'Nome', key: 'nome', width: 25 },
    { header: 'Categoria', key: 'categoria', width: 18 },
    { header: 'Grupo', key: 'grupo', width: 15 }
  ];

  // Formatação do header
  const headerRow2 = ws2.getRow(1);
  headerRow2.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F7D32' } };
  headerRow2.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow2.height = 25;

  // Adicionar dados
  confirmados.forEach((item, index) => {
    const row = ws2.addRow(item);
    row.font = { size: 10 };
    row.alignment = { horizontal: 'left', vertical: 'middle' };
    if ((index + 2) % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    }
  });

  // Salvar arquivo
  const filename = path.join(__dirname, 'exemplo_convidados.xlsx');
  await workbook.xlsx.writeFile(filename);
  console.log(`✅ Arquivo gerado com sucesso: ${filename}`);
}

generateExcel().catch(console.error);

