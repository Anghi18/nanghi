// Variables globales
let currentFileInput = null;
let appData = {
  source: null, // 'excel' o 'sheets'
  data: [],
  chartsInitialized: false
};
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
      
      appData.source = 'excel';
      appData.data = XLSX.utils.sheet_to_json(firstSheet, { header: ['item', 'planificado', 'real'] });
      appData.chartsInitialized = false;
      
      const html = XLSX.utils.sheet_to_html(firstSheet);
      document.getElementById('excelPreview').innerHTML = html;
      abrirModal();
    } catch (error) {
      mostrarNotificacion('Error al leer el archivo: ' + error.message, true);
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
  if (appData.data.length === 0) {
    mostrarNotificacion('No hay datos para analizar', true);
    return;
  }
  
  procesarDatosAnalisis(appData.data);
  cerrarModal();
  mostrarAnalisis();
}

function procesarDatosAnalisis(data) {
  const tbody = document.getElementById('analisisTableBody');
  const alertBox = document.getElementById('alertBox');
  let alertHTML = '<h3>Alertas:</h3><ul>';
  let hasAlerts = false;
  
  tbody.innerHTML = '';
  
  if (!data || data.length === 0) {
    alertBox.innerHTML = '<p>No hay datos para mostrar</p>';
    return;
  }
  
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

function mostrarRegistro() {
  ocultarTodasSecciones();
  
  const loginSection = document.getElementById('loginSection');
  loginSection.innerHTML = ''; // Limpiar completamente
  
  // Crear estructura completa del formulario de registro
  const registerHTML = `
    <div class="login-box">
      <div class="login-header">
        <img src="assets/logo.jpeg" alt="Logo" class="logo">
        <h2>Crear nueva cuenta</h2>
      </div>
      <form id="registerForm" class="register-form">
        <input type="text" id="registerName" placeholder="Nombre completo" required>
        <input type="email" id="registerEmail" placeholder="Correo electrónico" required>
        <input type="password" id="registerPassword" placeholder="Contraseña" required>
        <input type="password" id="registerConfirmPassword" placeholder="Confirmar contraseña" required>
        <button type="submit">Registrarse</button>
      </form>
      <div class="new-user">
        <p>¿Ya tienes cuenta?</p>
        <button id="backToLoginBtn">Iniciar sesión</button>
      </div>
    </div>
  `;
  
  // Insertar el HTML
  loginSection.insertAdjacentHTML('beforeend', registerHTML);
  
  // Asegurar que el contenedor se muestre
  loginSection.style.display = 'flex';
  
  // Registrar eventos después de que el HTML existe
  document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    registrarUsuario();
  });
  
  document.getElementById('backToLoginBtn').addEventListener('click', mostrarLogin);
}

// Y actualiza la función registrarUsuario() así:
function registrarUsuario() {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;

  // Validaciones
  if (!name || !email || !password || !confirmPassword) {
    mostrarNotificacion('Todos los campos son obligatorios', true);
    return;
  }

  if (password !== confirmPassword) {
    mostrarNotificacion('Las contraseñas no coinciden', true);
    return;
  }

  if (password.length < 6) {
    mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', true);
    return;
  }

  if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    mostrarNotificacion('Ingrese un correo electrónico válido', true);
    return;
  }

  // Simular registro exitoso
  mostrarNotificacion('Registro exitoso. Redirigiendo...');
  
  // Limpiar formulario
  document.getElementById('registerForm').reset();
  
  // Mostrar login después de 2 segundos
  setTimeout(mostrarLogin, 2000);
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
  
  // Mostrar u ocultar botón de actualización según el origen de los datos
  const refreshBtn = document.getElementById('refreshDataBtn');
  refreshBtn.style.display = appData.source === 'sheets' ? 'block' : 'none';
  
  if (appData.data.length > 0) {
    procesarDatosAnalisis(appData.data);
  }
}

function mostrarReportes() {
  ocultarTodasSecciones();
  document.getElementById('reportesSection').style.display = 'block';
  document.getElementById('generateReportBtn').style.display = 'none';
  
  if (!appData.chartsInitialized) {
    inicializarGraficos();
  } else {
    // Actualizar gráficos si ya existen
    if (tendenciaChart) tendenciaChart.update();
    if (comparacionChart) comparacionChart.update();
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

  if (!appData.data || appData.data.length === 0) {
    mostrarNotificacion('No hay datos disponibles para generar gráficos', true);
    return;
  }

  const datosGraficos = {
    items: [],
    planificado: [],
    real: []
  };

  appData.data.slice(1).forEach(row => {
    if (row.item && row.item.toString().trim() !== '') {
      datosGraficos.items.push(row.item);
      datosGraficos.planificado.push(parseFloat(row.planificado) || 0);
      datosGraficos.real.push(parseFloat(row.real) || 0);
    }
  });

  if (datosGraficos.items.length === 0) {
    mostrarNotificacion('Los datos no tienen el formato esperado', true);
    return;
  }

  // Gráfico de tendencia
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const labelsTendencia = meses.slice(0, Math.min(datosGraficos.items.length, 6));
  
  tendenciaChart = new Chart(
    document.getElementById('tendenciaChart'),
    {
      type: 'line',
      data: {
        labels: labelsTendencia,
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
      },
      options: { responsive: true }
    }
  );

  // Gráfico de comparación
  comparacionChart = new Chart(
    document.getElementById('comparacionChart'),
    {
      type: 'bar',
      data: {
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
      },
      options: { responsive: true }
    }
  );

  appData.chartsInitialized = true;
}

function exportarPDF() {
  const exportBtn = document.getElementById('exportPdfBtn');
  exportBtn.disabled = true;
  exportBtn.textContent = 'Generando PDF...';

  if (tendenciaChart) {
    tendenciaChart.update();
    tendenciaChart.render();
  }
  if (comparacionChart) {
    comparacionChart.update();
    comparacionChart.render();
  }

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
      mostrarNotificacion('Error al generar PDF. Por favor, intente nuevamente.', true);
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

function cerrarSesion() {
  mostrarLogin();
}

// Funciones para Google Sheets
function conectarGoogleSheets() {
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1UR2uZN4uSN6sK_7DhIF4ls16ipNXdcQbz5n23puVBwI/edit#gid=0';
  window.open(sheetUrl, '_blank');
  mostrarNotificacion('Complete sus datos en Google Sheets y luego haga clic en "Generar análisis"');
}

async function cargarDatosDesdeSheets() {
  try {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRe_SO-lnkG4p6whgSAS7mk8mGMGoruoi-AP_V1-wvFIcz8vhS2IY5EZT0LNldvG0-Vie62-4mvoRaB/pub?output=csv';
    
    const boton = document.getElementById('generateAnalysisFromSheets');
    const textoOriginal = boton.textContent;
    boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    boton.disabled = true;
    
    const response = await fetch(csvUrl);
    const csvData = await response.text();
    
    appData.source = 'sheets';
    appData.data = csvData.split('\n').slice(1).filter(row => row.trim() !== '').map(row => {
      const [item, planificado, real] = row.split(',');
      return {
        item: item?.replace(/"/g, '').trim() || '',
        planificado: parseFloat(planificado) || 0,
        real: parseFloat(real) || 0
      };
    });
    
    appData.chartsInitialized = false;
    mostrarAnalisis();
    
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
