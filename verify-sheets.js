#!/usr/bin/env node
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function verifySheets() {
  try {
    console.log('🔍 VERIFICANDO ARQUIVO GERADO...\n');
    
    // Verificar arquivo de teste
    const testFilePath = path.join(__dirname, 'test-download-mapping.xlsx');
    
    if (!fs.existsSync(testFilePath)) {
      console.log('❌ Arquivo não encontrado: ' + testFilePath);
      process.exit(1);
    }

    console.log('📂 Arquivo: ' + testFilePath);
    console.log('📊 Tamanho: ' + fs.statSync(testFilePath).size + ' bytes\n');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(testFilePath);

    console.log('📋 WORKSHEETS ENCONTRADOS:');
    console.log('----------------------------');
    workbook.worksheets.forEach((worksheet, index) => {
      console.log(`\n✓ Planilha ${index + 1}: "${worksheet.name}"`);
      console.log(`  - Número de linhas: ${worksheet.actualRowCount}`);
      console.log(`  - Número de colunas: ${worksheet.actualColumnCount}`);
      
      // Mostrar headers
      console.log(`  - Headers (primeira linha):`);
      const firstRow = worksheet.getRow(1);
      firstRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        console.log(`    [${colNumber}] ${cell.value || '(vazio)'}`);
      });

      // Mostrar primeira linha de dados
      if (worksheet.actualRowCount > 1) {
        console.log(`  - Primeira linha de dados:`);
        const secondRow = worksheet.getRow(2);
        secondRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          console.log(`    [${colNumber}] ${cell.value || '(vazio)'}`);
        });
      }
    });

    console.log('\n✅ Verificação concluída!');
  } catch (error) {
    console.error('❌ Erro ao verificar arquivo:', error);
    process.exit(1);
  }
}

verifySheets();
