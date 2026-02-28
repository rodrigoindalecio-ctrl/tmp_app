#!/usr/bin/env node
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Simular dados reais do evento
const eventGuestsData = [
  {
    id: '1',
    name: 'Ana Paula Ribeiro',
    email: 'ana.ribeiro@email.com',
    telefone: '(11) 91234-0001',
    grupo: 'Família Ribeiro',
    status: 'confirmed',
    category: 'adult_paying',
    companionsList: [
      { name: 'Rodrigo Ribeiro', isConfirmed: true, category: 'adult_paying' },
      { name: 'Paula Ribeiro', isConfirmed: true, category: 'child_paying' },
      { name: 'Lucas Ribeiro', isConfirmed: false, category: 'child_not_paying' }
    ]
  },
  {
    id: '2',
    name: 'Marina Costa',
    email: 'marina.costa@email.com',
    telefone: '(11) 98765-0002',
    grupo: 'Família Costa',
    status: 'pending',
    category: 'adult_paying',
    companionsList: [
      { name: 'João Costa', isConfirmed: true, category: 'child_paying' }
    ]
  }
];

async function testExportXLSX() {
  try {
    console.log('🔍 INICIANDO TESTE DE MAPEAMENTO DE DADOS...\n');
    
    const workbook = new ExcelJS.Workbook();
    
    // ===== PREPARAR DADOS ABA 1 (COM ACOMPANHANTES) =====
    console.log('📊 Preparando dados da Aba 1...');
    const aba1Rows = eventGuestsData.map((guest) => {
      const row = {
        nomePrincipal: guest.name,
        categoria: guest.category === 'adult_paying' ? 'Adulto Pagante' : guest.category === 'child_paying' ? 'Criança Pagante' : 'Criança Não Pagante',
        grupo: guest.grupo || '-',
        email: guest.email || '',
        telefone: guest.telefone || '',
        status: guest.status === 'confirmed' ? 'Confirmado' : guest.status === 'pending' ? 'Pendente' : 'Declinou',
        confirmadoEm: guest.status === 'confirmed' ? new Date().toLocaleDateString('pt-BR') : '',
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
      };

      // Adicionar até 5 acompanhantes com suas categorias
      if (guest.companionsList && guest.companionsList.length > 0) {
        for (let i = 0; i < Math.min(5, guest.companionsList.length); i++) {
          const companion = guest.companionsList[i];
          if (companion && companion.name && companion.name.trim()) {
            row[`acompanhante${i + 1}`] = companion.name;
            row[`categoriaAcomp${i + 1}`] = companion.category === 'adult_paying' ? 'Adulto Pagante' : companion.category === 'child_paying' ? 'Criança Pagante' : 'Criança Não Pagante';
            console.log(`  → Acompanhante ${i + 1}: ${companion.name}`);
          }
        }
      }

      return row;
    });
    console.log('✓ ' + aba1Rows.length + ' linhas preparadas para Aba 1\n');

    // ===== PREPARAR DADOS ABA 2 =====
    console.log('📊 Preparando dados da Aba 2...');
    const aba2Rows = [];
    
    eventGuestsData.forEach((guest) => {
      if (guest.status === 'confirmed') {
        aba2Rows.push({
          nome: guest.name,
          categoria: guest.category === 'adult_paying' ? 'Adulto Pagante' : guest.category === 'child_paying' ? 'Criança Pagante' : 'Criança Não Pagante',
          grupo: guest.grupo || '-'
        });
      }

      if (guest.companionsList && guest.companionsList.length > 0) {
        guest.companionsList.forEach((companion) => {
          if (companion.isConfirmed && companion.name.trim()) {
            aba2Rows.push({
              nome: companion.name,
              categoria: companion.category === 'adult_paying' ? 'Adulto Pagante' : companion.category === 'child_paying' ? 'Criança Pagante' : 'Criança Não Pagante',
              grupo: guest.grupo || '-'
            });
          }
        });
      }
    });
    console.log('✓ ' + aba2Rows.length + ' linhas preparadas para Aba 2\n');

    // ===== CRIAR ABA 1 =====
    console.log('📝 Criando Aba 1...');
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
    aba1Rows.forEach((row, index) => {
      const newRow = ws1.addRow(row);
      newRow.font = { size: 10 };
      newRow.alignment = { horizontal: 'left', vertical: 'middle' };
      if ((index + 2) % 2 === 0) {
        newRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      }
    });
    console.log('✓ Aba 1 criada com sucesso\n');

    // ===== CRIAR ABA 2 =====
    console.log('📝 Criando Aba 2...');
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
    aba2Rows.forEach((row, index) => {
      const newRow = ws2.addRow(row);
      newRow.font = { size: 10 };
      newRow.alignment = { horizontal: 'left', vertical: 'middle' };
      if ((index + 2) % 2 === 0) {
        newRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      }
    });
    console.log('✓ Aba 2 criada com sucesso\n');

    // ===== GERAR ARQUIVO =====
    console.log('💾 Gerando arquivo...');
    const buffer = await workbook.xlsx.writeBuffer();
    console.log('✓ Buffer gerado: ' + buffer.byteLength + ' bytes');

    const outputPath = path.join(__dirname, 'test-download-mapping.xlsx');
    fs.writeFileSync(outputPath, buffer);
    console.log('✅ Arquivo salvo em: ' + outputPath);

    // Verificar conteúdo
    console.log('\n📋 VERIFICAÇÃO DE MAPEAMENTO:');
    console.log('--------------------------------------');
    console.log('Aba 1 - Primeira linha:');
    const firstRow = aba1Rows[0];
    Object.entries(firstRow).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('--------------------------------------');
    console.log('Aba 2 - Primeira linha:');
    const firstRow2 = aba2Rows[0];
    Object.entries(firstRow2).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

  } catch (error) {
    console.error('❌ Erro ao gerar arquivo:', error);
    process.exit(1);
  }
}

testExportXLSX();
