/**
 * Converte il testo in formato markdown
 * @param text Il testo da convertire
 * @returns Il testo convertito in markdown
 */
export function convertToMarkdown(text: string): string {
  // Gestisci i titoli
  text = text.replace(/^# (.+)$/gm, "# $1")
  text = text.replace(/^## (.+)$/gm, "## $1")
  text = text.replace(/^### (.+)$/gm, "### $1")

  // Gestisci le liste
  text = text.replace(/^- (.+)$/gm, "- $1")
  text = text.replace(/^[0-9]+\. (.+)$/gm, "1. $1")

  // Gestisci il grassetto
  text = text.replace(/\*\*(.+?)\*\*/g, "**$1**")
  text = text.replace(/__(.+?)__/g, "**$1**")

  // Gestisci il corsivo
  text = text.replace(/\*(.+?)\*/g, "*$1*")
  text = text.replace(/_(.+?)_/g, "*$1*")

  return text
}
