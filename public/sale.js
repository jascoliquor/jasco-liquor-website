/* The current sale. For the next one, edit this file and swap the flyer picture.
   When "ends" passes, the whole site goes back to its normal look by itself and
   /deals says there is no sale posted. Times are Jackson time: -06:00 in winter, -05:00 in summer.

   qty: 2 means "2 for". tax: true means tax is included. shelf: the home page bottle it appears beside. */
window.JASCO_SALE = {
  name: "Thanksgiving Sale",
  theme: "thanksgiving",
  ends: "2026-11-26T22:00:00-06:00",
  until: "Prices good through Thanksgiving night, Thursday, November 26, at 10 PM.",
  short: "Through Thursday, November 26, at 10 PM.",
  hours: "Open regular hours on Thanksgiving Day, 10 AM to 10 PM.",
  flyer: "/images/thanksgiving-flyer.jpg",
  groups: [
    { title: "Cognac & Whiskey", items: [
      { name: "Hennessy VS", size: "750ml", price: "32.99", shelf: "cognac" },
      { name: "Hennessy", size: "1.75L", price: "69.99", shelf: "cognac" },
      { name: "Jack Daniel’s", size: "750ml", price: "20.99", shelf: "whiskey" },
      { name: "Crown Royal", size: "375ml", qty: 2, price: "22.99", shelf: "whiskey" }
    ] },
    { title: "Premium Bourbon", items: [
      { name: "Blanton’s Single Barrel", size: "750ml", price: "79.99", shelf: "whiskey" }
    ] },
    { title: "Tequila", items: [
      { name: "Don Julio Reposado", price: "50.00", tax: true, shelf: "tequila" },
      { name: "Patrón Silver", size: "375ml", price: "21.99", shelf: "tequila" },
      { name: "DeLeón Reposado", size: "375ml", qty: 2, price: "30.00", tax: true, shelf: "tequila" }
    ] },
    { title: "Vodka", items: [
      { name: "Grey Goose", size: "375ml", price: "19.99", shelf: "vodka" },
      { name: "Wheatley Vodka", size: "1.75L", qty: 2, price: "30.00", tax: true, shelf: "vodka" },
      { name: "Taaka Vodka", size: "750ml", qty: 3, price: "18.00", tax: true, shelf: "vodka" }
    ] },
    { title: "Wine & Sparkling", items: [
      { name: "Andre", qty: 3, price: "20.99", shelf: "wine" },
      { name: "Yellow Tail Wine", qty: 2, price: "20.00", shelf: "wine" }
    ] }
  ]
};
