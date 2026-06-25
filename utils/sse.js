const clientes = new Set();

function agregarCliente(res) {
  clientes.add(res);
}

function eliminarCliente(res) {
  clientes.delete(res);
}

function notificar(evento, datos = {}) {
  const mensaje = `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;
  clientes.forEach(res => {
    try { res.write(mensaje); } catch (e) { eliminarCliente(res); }
  });
}

module.exports = { agregarCliente, eliminarCliente, notificar };
