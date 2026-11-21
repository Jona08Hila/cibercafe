/* Modulo de seguridad XSS y validacion en tiempo real.
   Exportaciones puras compatibles con Tree Shaking. */

const FIELD_RULES = {
  nombre: {
    regex: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]{3,60}$/,
    charRegex: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/,
    example: "Ejemplo: Jonathan Escobar (solo letras y espacios, min. 3 caracteres)",
    errorMessage: "Usa solo letras y espacios (minimo 3 caracteres). No se permiten simbolos ni numeros."
  },
  codigo: {
    regex: /^[A-Za-z0-9-]{6,14}$/,
    charRegex: /^[A-Za-z0-9-]*$/,
    example: "Ejemplo: 78854844 o UPDS-202601 (letras, numeros y guion, 6 a 14 caracteres)",
    errorMessage: "Ingresa entre 6 y 14 caracteres validos (letras, numeros o guion '-' sin espacios)."
  },
  correo: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    charRegex: /^[^\s]*$/,
    example: "Ejemplo: usuario@upds.edu.bo (formato usuario@dominio.ext sin espacios)",
    errorMessage: "Formato de correo invalido. Ejemplo esperado: usuario@upds.edu.bo"
  },
  turno: {
    regex: /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s:-]{4,50}$/,
    charRegex: /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s:-]*$/,
    example: "Ejemplo: 15:00 - Budokai Tenkaichi 3 (letras, numeros, espacios, ':' y '-')",
    errorMessage: "Caracter o formato no permitido. Usa letras, numeros, ':', '-' o espacios (min. 4)."
  }
};

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizePlainText(value, maxLength = 80) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}

export function getRuleByField(fieldName) {
  return FIELD_RULES[fieldName] || null;
}

export function validateFieldValue(fieldName, rawValue) {
  const rule = FIELD_RULES[fieldName];
  if (!rule) {
    return { valid: true, message: "", hasInvalidChar: false };
  }

  const value = String(rawValue ?? "");
  const hasInvalidChar = !rule.charRegex.test(value);

  if (value.trim().length === 0) {
    return {
      valid: false,
      message: `Campo obligatorio. ${rule.example}`,
      hasInvalidChar: false
    };
  }

  if (hasInvalidChar) {
    return {
      valid: false,
      message: rule.errorMessage,
      hasInvalidChar: true
    };
  }

  if (!rule.regex.test(value.trim())) {
    return {
      valid: false,
      message: rule.errorMessage,
      hasInvalidChar: false
    };
  }

  return {
    valid: true,
    message: "",
    hasInvalidChar: false
  };
}