/**
 * Entregar un fichero al navegador.
 *
 * Lo comparten la imagen del contrato y la exportación de la ficha de nave: es
 * el mismo baile de ancla temporal, y los dos comentarios de abajo son la razón
 * de que no se pueda escribir más corto.
 */
export const saveFile = (file: File): void => {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  // El ancla tiene que estar en el documento y la URL no se puede revocar en
  // el mismo tick: algunos navegadores cancelan la descarga.
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
};
