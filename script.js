// Variables globales
let currentFileInput = null;
let excelData = [];
let tendenciaChart = null;
let comparacionChart = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  setupFileInput();
});

function setupEventListeners() {
  // Login
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    mostrarPresupuesto();
  });

  // Registro
  document.getElementById('registerBtn').addEventListener('click', mostrarRegistro);

  // Menús
  document.getElementById('userBtn').addEventListener('click', () => toggleDropdown('dropdownMenu'));
  document.getElementById('menuBtn').addEventListener('click', () => toggleDropdown('dropdownMenu'));
  document.getElementById('userBtnAnalisis').addEventListener('click', () => toggleDropdown('dropdownMenuAnalisis'));
  document.getElementById('menuBtnAnalisis').addEventListener('click', () => toggleDropdown('dropdownMenuAnalisis'));
  document.getElementById('userBtnReportes').addEventListener('click', () => toggleDropdown('dropdownMenuReportes'));
  document.getElementById('menuBtnReportes').addEventListener('click', () => toggleDropdown('dropdownMenuReportes'));

  // Navegación
  document.getElementById('analisisLink').addEventListener('click', function(e) {
    e.preventDefault();
    mostrarAnalisis();
  });
  document.getElementById('reportesLink').addEventListener('click', function(e) {
    e.preventDefault();
    mostrarReportes();
  });
  document.getElementById('logoutLink').addEventListener('click', function(e) {
    e.preventDefault();
    cerrarSesion();
  });
  document.getElementById('presupuestoLink').addEventListener('click', function(e) {
    e.preventDefault();
    mostrarPresupuesto();
  });
  document.getElementById('reportesLinkAnalisis').addEventListener('click', function(e) {
    e.preventDefault();
    mostrarReportes();
  });
  document.getElementById('logoutLinkAnalisis').addEventListener('click', function(e) {
    e.preventDefault();
    cerrarSesion();
  });
  document.getElementById('presupuestoLinkReportes').addEventListener('click', function(e) {
    e.preventDefault();
    mostrarPresupuesto();
  });
  document.getElementById('analisisLinkReportes').addEventListener('click', function(e) {
    e.preventDefault();
    mostrarAnalisis();
  });
  document.getElementById('logoutLinkReportes').addEventListener('click', function(e) {
    e.preventDefault();
    cerrarSesion();
  });

  // Botones
  document.getElementById('backBtn').addEventListener('click', mostrarPresupuesto);
  document.getElementById('volverBtn').addEventListener('click', mostrarAnalisis);
  document.getElementById('closeModal').addEventListener('click', cerrarModal);
  document.getElementById('generateAnalysis').addEventListener('click', generarAnalisis);
  document.getElementById('generateReportBtn').addEventListener('click', generarReporte);
  document.getElementById('exportPdfBtn').addEventListener('click', exportarPDF);
  document.getElementById('downloadTemplate').addEventListener('click', descargarPlantilla);
  document.getElementById('googleSheetsBtn').addEventListener('click', conectarGoogleSheets);
}

function setupFileInput() {
  if (currentFileInput) {
    currentFileInput.removeEventListener('change', handleFileUpload);
  }
  
  const fileInput = document.getElementById('excelInput');
  fileInput.value = '';
  fileInput.addEventListener('change', handleFileUpload);
  currentFileInput = fileInput;
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const generateBtn = document.getElementById('generateAnalysis');
  generateBtn.disabled = true;
  generateBtn.textContent = 'Procesando...';

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Guardar datos crudos y procesados
      window.excelRawData = firstSheet;
      excelData = XLSX.utils.sheet_to_json(firstSheet, { header: ['item', 'planificado', 'real'] });
      
      // Validar estructura del archivo
      const headers = Object.keys(excelData[0] || {});
      if (!headers.includes('item') || !headers.includes('planificado') || !headers.includes('real')) {
        alert('El archivo no tiene la estructura esperada. Por favor use la plantilla.');
        return;
      }
      
      const html = XLSX.utils.sheet_to_html(firstSheet);
      document.getElementById('excelPreview').innerHTML = html;
      abrirModal();
    } catch (error) {
      alert('Error al leer el archivo: ' + error.message);
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generar análisis';
    }
  };
  reader.readAsArrayBuffer(file);
}

function abrirModal() {
  document.getElementById('excelModal').style.display = 'flex';
}

function cerrarModal() {
  document.getElementById('excelModal').style.display = 'none';
}

function generarAnalisis() {
  if (excelData.length === 0) {
    alert('No hay datos para analizar');
    return;
  }
  
  procesarDatosAnalisis(excelData);
  cerrarModal();
  mostrarAnalisis();
}

function procesarDatosAnalisis(data) {
  const tbody = document.getElementById('analisisTableBody');
  const alertBox = document.getElementById('alertBox');
  let alertHTML = '<h3>Alertas:</h3><ul>';
  let hasAlerts = false;
  
  tbody.innerHTML = '';
  
  // Datos para gráficos
  const datosGraficos = {
    items: [],
    planificado: [],
    real: [],
    desviacion: []
  };
  
  data.slice(1).forEach(row => {
    if (!row.item || row.item.toString().trim() === '') return;
    
    const cleanPlanificado = parseFloat(row.planificado?.toString().replace(/[^0-9.-]/g, '')) || 0;
    const cleanReal = parseFloat(row.real?.toString().replace(/[^0-9.-]/g, '')) || 0;
    const diferencia = cleanReal - cleanPlanificado;
    const porcentaje = cleanPlanificado !== 0 ? ((diferencia / cleanPlanificado) * 100).toFixed(1) : 0;
    
    // Llenar datos para gráficos
    datosGraficos.items.push(row.item);
    datosGraficos.planificado.push(cleanPlanificado);
    datosGraficos.real.push(cleanReal);
    datosGraficos.desviacion.push(porcentaje);
    
    const rowHTML = `
      <tr>
        <td>${row.item}</td>
        <td>S/${cleanPlanificado.toLocaleString('es-PE')}</td>
        <td>S/${cleanReal.toLocaleString('es-PE')}</td>
        <td class="${diferencia >= 0 ? 'up' : 'down'}">
          ${Math.abs(porcentaje)}% ${diferencia >= 0 ? '▲' : '▼'}
        </td>
      </tr>
    `;
    tbody.innerHTML += rowHTML;
    
    if (Math.abs(porcentaje) > 10) {
      hasAlerts = true;
      alertHTML += `
        <li>
          <strong>${row.item}:</strong> ${diferencia >= 0 ? '+' : ''}${porcentaje}% 
          (S/${Math.abs(diferencia).toLocaleString('es-PE')})
        </li>
      `;
    }
  });
  
  alertHTML += '</ul>';
  alertBox.innerHTML = hasAlerts ? alertHTML : '<p>No hay alertas significativas</p>';
  
  // Guardar datos para gráficos
  window.datosParaGraficos = datosGraficos;
}

function toggleDropdown(id) {
  const dropdown = document.getElementById(id);
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function mostrarLogin() {
  ocultarTodasSecciones();
  document.getElementById('loginSection').style.display = 'flex';
}

function mostrarPresupuesto() {
  ocultarTodasSecciones();
  document.getElementById('presupuestoSection').style.display = 'block';
  setupFileInput();
}

function mostrarAnalisis() {
  ocultarTodasSecciones();
  document.getElementById('analisisSection').style.display = 'block';
  document.getElementById('generateReportBtn').style.display = 'block';
  
  if (excelData.length > 0) {
    procesarDatosAnalisis(excelData);
  }
}

function mostrarReportes() {
  ocultarTodasSecciones();
  document.getElementById('reportesSection').style.display = 'block';
  document.getElementById('generateReportBtn').style.display = 'none';
  
  // Destruir gráficos existentes y crear nuevos con datos actualizados
  if (tendenciaChart) tendenciaChart.destroy();
  if (comparacionChart) comparacionChart.destroy();
  inicializarGraficos();
}

function ocultarTodasSecciones() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('presupuestoSection').style.display = 'none';
  document.getElementById('analisisSection').style.display = 'none';
  document.getElementById('reportesSection').style.display = 'none';
}

function generarReporte() {
  mostrarReportes();
}

function inicializarGraficos() {
  // Usar datos reales si existen, o datos de ejemplo como fallback
  const datos = window.datosParaGraficos || {
    items: ['Materiales', 'Mano de obra', 'Equipos', 'Subcontratos', 'Gastos generales'],
    planificado: [15000, 20000, 8000, 12000, 5000],
    real: [18500, 22300, 7200, 15750, 4800],
    desviacion: [23.3, 11.5, -10.0, 31.3, -4.0]
  };

  // Gráfico de tendencia (usamos meses como ejemplo)
  const datosTendencia = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Planificado',
        data: datos.planificado.slice(0, 6).map(val => val * 0.8 + val * 0.4 * Math.random()),
        borderColor: '#4e4376',
        backgroundColor: 'rgba(78, 67, 118, 0.1)',
        tension: 0.3
      },
      {
        label: 'Real',
        data: datos.real.slice(0, 6).map(val => val * 0.8 + val * 0.4 * Math.random()),
        borderColor: '#2b5876',
        backgroundColor: 'rgba(43, 88, 118, 0.1)',
        tension: 0.3
      }
    ]
  };

  // Gráfico de comparación (usamos los primeros 5 items)
  const datosComparacion = {
    labels: datos.items.slice(0, 5),
    datasets: [
      {
        label: 'Planificado',
        data: datos.planificado.slice(0, 5),
        backgroundColor: '#4e4376'
      },
      {
        label: 'Real',
        data: datos.real.slice(0, 5),
        backgroundColor: '#2b5876'
      }
    ]
  };

  tendenciaChart = new Chart(
    document.getElementById('tendenciaChart'),
    {
      type: 'line',
      data: datosTendencia,
      options: { responsive: true }
    }
  );

  comparacionChart = new Chart(
    document.getElementById('comparacionChart'),
    {
      type: 'bar',
      data: datosComparacion,
      options: { responsive: true }
    }
  );

  window.chartsInitialized = true;
}

function exportarPDF() {
  const exportBtn = document.getElementById('exportPdfBtn');
  exportBtn.disabled = true;
  exportBtn.textContent = 'Generando PDF...';

  // Forzar renderizado
  if (tendenciaChart) {
    tendenciaChart.update();
    tendenciaChart.render();
  }
  if (comparacionChart) {
    comparacionChart.update();
    comparacionChart.render();
  }

  // Ocultar elementos
  const elementsToHide = document.querySelectorAll('.reportes-actions, .user-menu');
  elementsToHide.forEach(el => el.style.opacity = '0');

  setTimeout(() => {
    const element = document.getElementById('reportesSection');
    
    html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF'
    }).then(canvas => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 10, 10, pdfWidth, pdfHeight);
      pdf.save('reporte_nanghi.pdf');
    }).catch(err => {
      console.error('Error:', err);
      alert('Error al generar PDF. Por favor, intente nuevamente.');
    }).finally(() => {
      elementsToHide.forEach(el => el.style.opacity = '1');
      exportBtn.disabled = false;
      exportBtn.textContent = 'Exportar como PDF';
    });
  }, 500);
}

function descargarPlantilla() {
  alert("Descargando plantilla...");
  // Implementar descarga real aquí
}

function conectarGoogleSheets() {
  alert("Conectando a Google Sheets...");
  // Implementar conexión real aquí
}

function mostrarRegistro() {
  alert("Función de registro en desarrollo");
}

function cerrarSesion() {
  mostrarLogin();
}

// Iniciar
mostrarLogin();
