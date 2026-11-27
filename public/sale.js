/* The current sale, or null when there is none (then /deals says no sale is posted).

   For the next sale, replace null with an object like this, and add the bottle pictures
   to images/deals. When "ends" passes, the whole site goes back to its normal look by itself.
   Times are Jackson time: -06:00 in winter, -05:00 in summer.

   window.JASCO_SALE = {
     name: "Holiday Sale",
     theme: "holiday",            // CSS class theme-holiday in sale.css; leave out for no theme
     ends: "2026-12-31T22:00:00-06:00",
     until: "Prices good through Thursday, December 31, at 10 PM.",
     short: "Through Thursday, December 31, at 10 PM.",
     hours: "Open regular hours, 10 AM to 10 PM.",
     groups: [
       { title: "Cognac", items: [
         { name: "Hennessy VS", pic: "hennessy-vs", size: "750ml", price: "32.99", shelf: "cognac" }
       ] }
     ]
   };

   qty: 2 means "2 for". tax: true shows "Tax included" (nothing is added at the register).
   shelf: the home page bottle it appears beside (whiskey, cognac, tequila, vodka, gin, wine).
   pic: the bottle picture, images/deals/<pic>.webp, cut out on a clear background. */
window.JASCO_SALE = null;
