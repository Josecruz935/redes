// script.js

document.addEventListener("DOMContentLoaded", function() {
    // Obtener el formulario y el campo de fecha
    const form = document.getElementById("dataForm");
    const datetimeInput = document.getElementById("datetime");

    // Función para obtener la fecha y hora actual en formato adecuado
    function obtenerFechaHora() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // Asignar la fecha y hora al campo correspondiente
    datetimeInput.value = obtenerFechaHora();

    // Evento de envío del formulario
    form.addEventListener("submit", function(event) {
        event.preventDefault(); // Prevenir el comportamiento predeterminado del formulario

        const ip = document.getElementById("ip").value;
        const port = document.getElementById("port").value;
        const datetime = datetimeInput.value;

        // Enviar los datos al servidor usando fetch (AJAX)
        fetch("/guardar-datos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ip, port, datetime })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Datos guardados correctamente:', data);
            alert("¡Datos guardados correctamente!");
        })
        .catch(error => {
            console.error('Error al guardar los datos:', error);
            alert("Hubo un error al guardar los datos.");
        });
    });
});
