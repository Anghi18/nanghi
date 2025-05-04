// Variables globales
let currentFileInput = null;
let excelData = [];
let tendenciaChart = null;
let comparacionChart = null;
let intervaloActualizacion;

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
  document.getElementById('generateAnalysisFromSheets').addEventListener('click', cargarDatosDesdeSheets);
  document.getElementById('refreshDataBtn').addEventListener('click', actualizarDatos);
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

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      excelData = XLSX.utils.sheet_to_json(firstSheet, { header: ['item', 'planificado', 'real'] });
      const html = XLSX.utils.sheet_to_html(firstSheet);
      
      document.getElementById('excelPreview').innerHTML = html;
      abrirModal();
    } catch (error) {
      alert('Error al leer el archivo: ' + error.message);
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
    mostrarNotificacion('No hay datos para analizar', true);
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
  
  data.slice(1).forEach(row => {
    if (!row.item || row.item.toString().trim() === '') return;
    
    const cleanPlanificado = parseFloat(row.planificado?.toString().replace(/[^0-9.-]/g, '')) || 0;
    const cleanReal = parseFloat(row.real?.toString().replace(/[^0-9.-]/g, '')) || 0;
    const diferencia = cleanReal - cleanPlanificado;
    const porcentaje = cleanPlanificado !== 0 ? ((diferencia / cleanPlanificado) * 100).toFixed(1) : 0;
    
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
}

function toggleDropdown(id) {
  const dropdown = document.getElementById(id);
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function mostrarLogin() {
  if (intervaloActualizacion) clearInterval(intervaloActualizacion);
  ocultarTodasSecciones();
  document.getElementById('loginSection').style.display = 'flex';
}

function mostrarPresupuesto() {
  if (intervaloActualizacion) clearInterval(intervaloActualizacion);
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
  
  if (!window.chartsInitialized) {
    inicializarGraficos();
  }
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
  if (tendenciaChart) tendenciaChart.destroy();
  if (comparacionChart) comparacionChart.destroy();

  // Procesar datos para gráficos
  const datosGraficos = {
    items: [],
    planificado: [],
    real: []
  };

  // Filtrar y procesar datos (excluyendo filas vacías o sin item)
  excelData.slice(1).forEach(row => {
    if (row.item && row.item.toString().trim() !== '') {
      datosGraficos.items.push(row.item);
      datosGraficos.planificado.push(parseFloat(row.planificado) || 0);
      datosGraficos.real.push(parseFloat(row.real) || 0);
    }
  });

  // Si no hay datos, usar valores por defecto
  if (datosGraficos.items.length === 0) {
    datosGraficos.items = ['Materiales', 'Mano de obra', 'Equipos', 'Subcontratos', 'Gastos generales'];
    datosGraficos.planificado = [15000, 20000, 8000, 12000, 5000];
    datosGraficos.real = [18500, 22300, 7200, 15750, 4800];
  }

  // Gráfico de tendencia (usar primeros 6 meses)
  const datosTendencia = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Planificado',
        data: datosGraficos.planificado.slice(0, 6),
        borderColor: '#4e4376',
        backgroundColor: 'rgba(78, 67, 118, 0.1)',
        tension: 0.3
      },
      {
        label: 'Real',
        data: datosGraficos.real.slice(0, 6),
        borderColor: '#2b5876',
        backgroundColor: 'rgba(43, 88, 118, 0.1)',
        tension: 0.3
      }
    ]
  };

  // Gráfico de comparación (usar primeros 5 items)
  const datosComparacion = {
    labels: datosGraficos.items.slice(0, 5),
    datasets: [
      {
        label: 'Planificado',
        data: datosGraficos.planificado.slice(0, 5),
        backgroundColor: '#4e4376'
      },
      {
        label: 'Real',
        data: datosGraficos.real.slice(0, 5),
        backgroundColor: '#2b5876'
      }
    ]
  };

  // Crear gráficos
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

function mostrarRegistro() {
  alert("Función de registro en desarrollo");
}

function cerrarSesion() {
  mostrarLogin();
}

// Funciones para Google Sheets
function conectarGoogleSheets() {
  // Abrir el Sheet específico en nueva pestaña
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1UR2uZN4uSN6sK_7DhIF4ls16ipNXdcQbz5n23puVBwI/edit#gid=0';
  window.open(sheetUrl, '_blank');
  
  // Mostrar notificación
  mostrarNotificacion('Complete sus datos en Google Sheets y luego haga clic en "Generar análisis"');
}

async function cargarDatosDesdeSheets() {
  try {
    // URL pública de publicación (misma que Nayeli)
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRe_SO-lnkG4p6whgSAS7mk8mGMGoruoi-AP_V1-wvFIcz8vhS2IY5EZT0LNldvG0-Vie62-4mvoRaB/pub?output=csv';
    
    // Mostrar carga
    const boton = document.getElementById('generateAnalysisFromSheets');
    const textoOriginal = boton.textContent;
    boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    boton.disabled = true;
    
    // Obtener datos
    const response = await fetch(csvUrl);
    const csvData = await response.text();
    
    // Convertir CSV a JSON
    excelData = csvData.split('\n').slice(1).filter(row => row.trim() !== '').map(row => {
      const [item, planificado, real] = row.split(',');
      return {
        item: item?.replace(/"/g, '').trim() || '',
        planificado: parseFloat(planificado) || 0,
        real: parseFloat(real) || 0
      };
    });
    
    // Mostrar análisis
    mostrarAnalisis();
    
    // Configurar actualización automática cada minuto
    if (intervaloActualizacion) clearInterval(intervaloActualizacion);
    intervaloActualizacion = setInterval(actualizarDatos, 60000);
    
  } catch (error) {
    console.error("Error al cargar Google Sheets:", error);
    mostrarNotificacion('Error al cargar datos. Verifique la conexión', true);
  } finally {
    const boton = document.getElementById('generateAnalysisFromSheets');
    if (boton) {
      boton.textContent = textoOriginal;
      boton.disabled = false;
    }
  }
}

async function actualizarDatos() {
  try {
    const boton = document.getElementById('refreshDataBtn');
    boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    boton.disabled = true;
    
    await cargarDatosDesdeSheets();
    mostrarNotificacion('Datos actualizados correctamente');
    
  } catch (error) {
    console.error("Error al actualizar:", error);
    mostrarNotificacion('Error al actualizar datos', true);
  } finally {
    const boton = document.getElementById('refreshDataBtn');
    if (boton) {
      boton.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Datos';
      boton.disabled = false;
    }
  }
}

function mostrarNotificacion(mensaje, esError = false) {
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion ${esError ? 'error' : 'exito'}`;
  notificacion.textContent = mensaje;
  document.body.appendChild(notificacion);
  
  setTimeout(() => document.body.removeChild(notificacion), 3000);
}

// Iniciar
mostrarLogin();
