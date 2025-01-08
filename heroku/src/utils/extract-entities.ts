// Array dei dati sensibili con rispettivi token e tipo
const sensitiveDataArray: {
  key: string
  value: string
  type: "CLIENT" | "PRODUCT" | "SELLER" | "OTHER"
}[] = [
  // CLIENTI
  { key: "Ballard Acres Farm", value: "TOKEN_CLIENT_0001", type: "CLIENT" },
  {
    key: "Conant's Riverside Farm LLC",
    value: "TOKEN_CLIENT_0002",
    type: "CLIENT",
  },
  { key: "CTS Dairy", value: "TOKEN_CLIENT_0003", type: "CLIENT" },
  { key: "Dimock Farms LLC", value: "TOKEN_CLIENT_0004", type: "CLIENT" },
  {
    key: "Gervais Family - Farm #2",
    value: "TOKEN_CLIENT_0005",
    type: "CLIENT",
  },
  { key: "Gotham Family Farm LLC", value: "TOKEN_CLIENT_0006", type: "CLIENT" },
  { key: "Hidden View Farm", value: "TOKEN_CLIENT_0007", type: "CLIENT" },
  { key: "Highway View Farm", value: "TOKEN_CLIENT_0008", type: "CLIENT" },
  { key: "Keewaydin Farm", value: "TOKEN_CLIENT_0009", type: "CLIENT" },
  { key: "Mapleline Farm", value: "TOKEN_CLIENT_0010", type: "CLIENT" },
  { key: "Mike & Donna Nolan", value: "TOKEN_CLIENT_0011", type: "CLIENT" },
  { key: "Nolan Family Farm LLC", value: "TOKEN_CLIENT_0012", type: "CLIENT" },
  { key: "Patrick O'Donnell", value: "TOKEN_CLIENT_0013", type: "CLIENT" },
  { key: "Smith Dairy LLC", value: "TOKEN_CLIENT_0014", type: "CLIENT" },
  { key: "Sizen Dairy Farm", value: "TOKEN_CLIENT_0015", type: "CLIENT" },
  { key: "Bruce & Mary Taft", value: "TOKEN_CLIENT_0016", type: "CLIENT" },
  { key: "Vern-Mont Farm LLC", value: "TOKEN_CLIENT_0017", type: "CLIENT" },
  { key: "Westminster Farms", value: "TOKEN_CLIENT_0018", type: "CLIENT" },
  { key: "Wood Farm LLC", value: "TOKEN_CLIENT_0019", type: "CLIENT" },
  {
    key: "UVM Paul Miller Research Cent",
    value: "TOKEN_CLIENT_0020",
    type: "CLIENT",
  },
  {
    key: "Highland Farms Dairy LLC",
    value: "TOKEN_CLIENT_0021",
    type: "CLIENT",
  },
  { key: "Taylor Dairy Farm", value: "TOKEN_CLIENT_0022", type: "CLIENT" },
  { key: "Devine Farms Inc.", value: "TOKEN_CLIENT_0023", type: "CLIENT" },
  { key: "Gervais Family Farm", value: "TOKEN_CLIENT_0024", type: "CLIENT" },
  { key: "Kelly Dairy LLC", value: "TOKEN_CLIENT_0025", type: "CLIENT" },
  { key: "Remillard Farms", value: "TOKEN_CLIENT_0026", type: "CLIENT" },
  { key: "Pinello/Savello Farm", value: "TOKEN_CLIENT_0027", type: "CLIENT" },
  {
    key: "Jordan Dairy Farms Inc.",
    value: "TOKEN_CLIENT_0028",
    type: "CLIENT",
  },
  { key: "Naughtaveel Farm", value: "TOKEN_CLIENT_0029", type: "CLIENT" },

  // PRODOTTI
  {
    key: "BULK AL TRANS HEIF PELLET",
    value: "TOKEN_PRODUCT_0101",
    type: "PRODUCT",
  },
  { key: "Ballard Protein Mash", value: "TOKEN_PRODUCT_0102", type: "PRODUCT" },
  { key: "Ballard CUD Mash", value: "TOKEN_PRODUCT_0103", type: "PRODUCT" },
  {
    key: "OptiMilk 24-20 4 Seasons BOV Milk Replacer",
    value: "TOKEN_PRODUCT_0104",
    type: "PRODUCT",
  },
  { key: "DRY COW MINERAL II", value: "TOKEN_PRODUCT_0105", type: "PRODUCT" },
  { key: "Opti-C.A.F. Starter", value: "TOKEN_PRODUCT_0106", type: "PRODUCT" },
  { key: "Bulk Farm Molasses", value: "TOKEN_PRODUCT_0107", type: "PRODUCT" },
  {
    key: "Alphaline Advantage 24/24 Bov",
    value: "TOKEN_PRODUCT_0108",
    type: "PRODUCT",
  },
  { key: "Conant High Mash", value: "TOKEN_PRODUCT_0109", type: "PRODUCT" },
  { key: "Conant Low Mash", value: "TOKEN_PRODUCT_0110", type: "PRODUCT" },
  { key: "Conant CUD Mash", value: "TOKEN_PRODUCT_0111", type: "PRODUCT" },
  { key: "Conant Fresh Mash", value: "TOKEN_PRODUCT_0112", type: "PRODUCT" },
  {
    key: "Conant Heifer Mineral",
    value: "TOKEN_PRODUCT_0113",
    type: "PRODUCT",
  },
  { key: "Conant Heifer Mash", value: "TOKEN_PRODUCT_0114", type: "PRODUCT" },
  { key: "Bulk Soybean Meal", value: "TOKEN_PRODUCT_0115", type: "PRODUCT" },
  { key: "Dimock High Mash", value: "TOKEN_PRODUCT_0116", type: "PRODUCT" },
  { key: "Dimock Low Mash", value: "TOKEN_PRODUCT_0117", type: "PRODUCT" },
  { key: "Dimock Fresh Mash", value: "TOKEN_PRODUCT_0118", type: "PRODUCT" },
  {
    key: "Dimock Dry Cow CUD Mash",
    value: "TOKEN_PRODUCT_0119",
    type: "PRODUCT",
  },
  {
    key: "Dimock Farm Bulk Heifer Minera",
    value: "TOKEN_PRODUCT_0120",
    type: "PRODUCT",
  },
  {
    key: "Gervais Farm II High Mash",
    value: "TOKEN_PRODUCT_0121",
    type: "PRODUCT",
  },
  {
    key: "Gervais Farm II CUD Mash",
    value: "TOKEN_PRODUCT_0122",
    type: "PRODUCT",
  },
  {
    key: "Gervais Farm 2 Lact1 High Mash",
    value: "TOKEN_PRODUCT_0123",
    type: "PRODUCT",
  },
  {
    key: "Gervais Farm II Midd/Low Mash",
    value: "TOKEN_PRODUCT_0124",
    type: "PRODUCT",
  },
  {
    key: "Gervais Farm II Fresh Mash",
    value: "TOKEN_PRODUCT_0125",
    type: "PRODUCT",
  },
  {
    key: "Gotham Farm High Mash",
    value: "TOKEN_PRODUCT_0127",
    type: "PRODUCT",
  },
  { key: "Gotham Low Mash", value: "TOKEN_PRODUCT_0128", type: "PRODUCT" },
  { key: "Gotham Farm CUD Mash", value: "TOKEN_PRODUCT_0129", type: "PRODUCT" },
  {
    key: "Gotham Farm Fresh Mash",
    value: "TOKEN_PRODUCT_0130",
    type: "PRODUCT",
  },
  {
    key: "Gotham 22% Heifer Pellet",
    value: "TOKEN_PRODUCT_0131",
    type: "PRODUCT",
  },

  // VENDITORI
  { key: "GINGUE, D", value: "TOKEN_SELLER_0001", type: "SELLER" },
  { key: "CARABEAU, M", value: "TOKEN_SELLER_0002", type: "SELLER" },
  { key: "PIERCE, R.", value: "TOKEN_SELLER_0003", type: "SELLER" },
  { key: "MOLESKY, P", value: "TOKEN_SELLER_0004", type: "SELLER" },
  { key: "ST. ONGE, M", value: "TOKEN_SELLER_0005", type: "SELLER" },
  { key: "FLINT, H", value: "TOKEN_SELLER_0006", type: "SELLER" },
  { key: "ANDREW, A", value: "TOKEN_SELLER_0007", type: "SELLER" },

  // OTHER (Eur, Dollar, Farm, Family)
  { key: "Eur", value: "TOKEN_OTHER_0001", type: "OTHER" },
  { key: "Dollar", value: "TOKEN_OTHER_0002", type: "OTHER" },
  { key: "Farm", value: "TOKEN_OTHER_0003", type: "OTHER" },
  { key: "Family", value: "TOKEN_OTHER_0004", type: "OTHER" },
  { key: "Bulk", value: "TOKEN_OTHER_0004", type: "OTHER" },
]

// Funzione per tokenizzare (sostituire i dati sensibili con i rispettivi token)
export function tokenize(inputString: string, conversationId: string): string {
  // Aggiungiamo conversationId al token per personalizzare
  const personalizedSensitiveDataArray = sensitiveDataArray.map((item) => ({
    key: item.key.toLowerCase(), // Convertiamo la chiave in lowercase per il confronto
    value: `${item.value}_${conversationId}`, // Aggiungiamo conversationId
  }))

  // Creiamo una regex con case-insensitivity
  const regex = new RegExp(
    personalizedSensitiveDataArray
      .map((item) => escapeRegex(item.key))
      .join("|"),
    "gi" // 'g' per sostituire globalmente, 'i' per ignorare maiuscole/minuscole
  )

  return inputString.replace(regex, (match) => {
    const found = personalizedSensitiveDataArray.find(
      (item) => item.key === match.toLowerCase()
    )
    return found ? found.value : match
  })
}

// Funzione per untokenizzare (ripristinare i dati sensibili dai token)
export function untokenize(
  inputString: string,
  conversationId: string
): string {
  // Rimuoviamo il conversationId dal token
  const reverseMap = Object.fromEntries(
    sensitiveDataArray.map((item) => [
      `${item.value}_${conversationId}`,
      item.key, // Manteniamo le chiavi nella forma originale
    ])
  )

  // Creiamo una regex per i token
  const regex = new RegExp(
    Object.keys(reverseMap).map(escapeRegex).join("|"),
    "g" // 'g' per sostituire globalmente
  )

  return inputString.replace(regex, (match) => {
    return reverseMap[match] // I token sono esatti
  })
}

// Funzione di utilità per gestire caratteri speciali nei regex
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
