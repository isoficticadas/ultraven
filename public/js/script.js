document.addEventListener("DOMContentLoaded", function () {
  // Mostrar y ocultar la ventana emergente
  document.querySelectorAll(".feedback").forEach((button) => {
    button.addEventListener("click", () => {
      const popup = document.querySelector(".popup-window");
      if (popup) {
        popup.style.display = "block";
      }
    });
  });

  document.querySelectorAll(".close-popup").forEach((button) => {
    button.addEventListener("click", () => {
      const popup = document.querySelector(".popup-window");
      if (popup) {
        popup.style.display = "none";
      }
    });
  });

  // Validación de formulario
  function validateForm(name, phone) {
    const namePattern = /^[A-Za-z\s]+$/;
    const phonePattern = /^\+593\d{9}$/;

    if (!name.trim() || !namePattern.test(name.trim())) {
      alert("Por favor, ingrese un nombre válido. Solo se permiten letras y espacios.");
      return false;
    }

    if (!phonePattern.test(phone.trim())) {
      alert("Por favor, ingrese un número de teléfono válido. Ejemplo: +593933543342");
      return false;
    }

    return true;
  }

  // Manejar el envío de formularios
  function handleFormSubmit(formId, nameInputName, phoneInputName) {
    const form = document.querySelector(formId);

    if (!form) {
      console.warn(`El formulario con ID ${formId} no fue encontrado.`);
      return;
    }

    const nameInput = form.querySelector(`input[name="${nameInputName}"]`);
    const phoneInput = form.querySelector(`input[name="${phoneInputName}"]`);

    if (!nameInput || !phoneInput) {
      console.warn(`Los campos del formulario ${formId} no fueron encontrados.`);
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const name = nameInput.value;
      const phone = phoneInput.value;

      if (!validateForm(name, phone)) {
        nameInput.focus();
        return;
      }

      fetch("/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Error al enviar los datos.");
          }
          alert("Sus datos fueron enviados y un agente se comunicará con usted dentro de 1 a 5 minutos.");
          form.reset();
          const popup = document.querySelector(".popup-window");
          if (popup) {
            popup.style.display = "none";
          }
        })
        .catch((error) => {
          console.error(error);
          alert("Error al enviar los datos. Por favor, inténtelo de nuevo.");
        });
    });
  }

  // Asociar validación y envío a todos los formularios
  const forms = [
    { formId: "#dataForm", nameInputName: "name", phoneInputName: "phone" },
    { formId: "#dataForm2", nameInputName: "name", phoneInputName: "phone" },
    { formId: "#dataForm3", nameInputName: "name", phoneInputName: "phone" },
  ];

  forms.forEach(({ formId, nameInputName, phoneInputName }) => {
    handleFormSubmit(formId, nameInputName, phoneInputName);
  });
});
