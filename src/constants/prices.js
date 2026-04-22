export const PRICE_SECTIONS = [
  {
    id: "bath-double-coat",
    title: "Bath Only · Double Coats",
    subtitle: "No hair cut — bath, brush out, nails & ears",
    addOn: "Perimeter Trim (feet, sani, tail, feathers, undercarriage): base price  $20–$40",
    items: [
      { name: "Australian Shepherd",  price: "$90"  },
      { name: "Belgian Shepherd",     price: "$130" },
      { name: "Bernese Mountain Dog", price: "$105" },
      { name: "German Shepherd",      price: "$90"  },
      { name: "Golden Retriever",     price: "$85"  },
      { name: "Great Pyrenees",       price: "$150" },
      { name: "Husky",                price: "$90"  },
      { name: "Labrador Retriever",   price: "$80"  },
      { name: "Newfoundland Dog",     price: "$180" },
      { name: "Malamute",             price: "$130" },
      { name: "Pomeranian",           price: "$80"  },
      { name: "Samoyed",              price: "$130" },
      { name: "Shetland Sheep Dog",   price: "$90"  },
      { name: "St. Bernard",          price: "$140" },
    ],
  },

  {
    id: "full-grooming-continuous",
    title: "Full Grooming · Continuous Growing Coats",
    subtitle: "Bath, brush out, shave/style, nails and ears",
    items: [
      { name: "Airedale Terrier",          price: "$115" },
      { name: "Bichon",                    price: "$80"         },
      { name: "Chihuahua (Long Hair)",     price: "$70"  },
      { name: "Cockapoo",                  price: "$90"  },
      { name: "Cocker Spaniel",            price: "$90"  },
      { name: "Golden Doodle (Mini)",      price: "$90–$95"     },
      { name: "Golden Doodle (Standard)",  price: "$115" },
      { name: "Lhasa Apso",               price: "$80"         },
      { name: "Poodle (Mini)",             price: "$80"         },
      { name: "Poodle (Standard)",         price: "$115" },
      { name: "Schnauzer (Mini)",          price: "$80–$90"     },
      { name: "Schnauzer (Giant)",         price: "$130" },
      { name: "Shih Tzu",                 price: "$80"         },
      { name: "Springer Spaniel",          price: "$110"        },
      { name: "Terrier Mix",               price: "$80–$90"     },
      { name: "Westie",                    price: "$80"         },
      { name: "Wheaton Terrier",           price: "$90–$120"    },
    ],
  },

  {
    id: "full-grooming-by-size",
    title: "Full Grooming By Size",
    subtitle: "Not including deshed, mat removal or temperament",
    addOn: "Work through requests add-on: $20",
    items: [
      { name: "Small (less than 20 lb)",  price: "$75"  },
      { name: "Medium (21–50 lb)",        price: "$80"  },
      { name: "Large (51–80 lb)",         price: "$100" },
      { name: "XLarge (81 lb)",    price: "$120" },
    ],
  },

  {
    id: "bath-tidy-short-hair",
    title: "Bath & Tidy · Short Hair Dogs",
    items: [
      {
        name: "Small breeds",
        price: "$50",
        tags: ["chihuahua", "beagle", "boston terrier", "bull terrier", "french bulldog", "french bull dog", "jack russell", "jack russel", "miniature pinscher", "mini pinscher", "pug"],
      },
      {
        name: "Medium breeds",
        price: "$75",
        tags: ["boxer", "basset hound", "dalmatian", "coon hound", "english bulldog", "greyhound", "pitbull", "pit x", "pointer", "vizsla"],
      },
      {
        name: "Large breeds",
        price: "$90",
        tags: ["american bulldog", "bordeaux", "cane corso", "great dane", "mastiff", "rottweiler"],
      },
    ],
  },

  {
    id: "quick-services-dog",
    title: "Quick Services · Dog",
    items: [
      { name: "Nail Trimming",           price: "$15"       },
      { name: "Nail Dremel / Grinding",  price: "$25"       },
      { name: "Anal Expression",         price: "$15"       },
      { name: "Teeth Brushing",          price: "$10"       },
      { name: "Sanitary Trim",           price: "$15"},
      { name: "Nails & Feet",            price: "$25"},
      { name: "Nails & Face",            price: "$25"},
      { name: "Nails, Feet & Face",      price: "$30"},
      { name: "Nails, Feet, Face & Sani",price: "$35"},
    ],
  },

  {
    id: "puppy-package",
    title: "Puppy Package",
    subtitle: "5 months or younger, after 2nd set of shots",
    note: "Includes bath, trim face, feet, sani, ears & nail trim. Full groom not recommended for puppy's first groom.",
    items: [
      { name: "Small",  price: "$45" },
      { name: "Medium", price: "$55" },
      { name: "Large",  price: "$65" },
    ],
  },

  {
    id: "cat-short-hair",
    title: "Cat Grooming · Short Haired",
    subtitle: "Includes brush out & nail trim",
    note: "Aggressive cats: $20",
    addOn: "Dematting / Pelt Removal: $15–$50 add-on",
    items: [
      { name: "Full Groom — brush out, no bath", price: "$65"  },
      { name: "Full Groom — brush out with bath", price: "$90" },
    ],
  },

  {
    id: "cat-long-hair",
    title: "Cat Grooming · Long Haired",
    subtitle: "Includes brush out and/or haircut & nail trim",
    note: "Aggressive cats: $20",
    addOn: "Dematting / Pelt Removal: $15–$50 add-on · Comb Cut: $15 add-on (well-behaved cats only)",
    items: [
      { name: "Full Groom — no bath",   price: "$90"  },
      { name: "Full Groom — with bath", price: "$105" },
    ],
  },

  {
    id: "quick-services-cat",
    title: "Quick Services · Cat",
    note: "We no longer offer nail cap application.",
    items: [
      { name: "Nail Trimming",              price: "$20"     },
      { name: "Sani / Bum Shave",          price: "$35 (includes nails)" },
      { name: "Paw Trim",                   price: "$30 (includes nails)" },
      { name: "Small Mat Removal",          price: "$25–$50 (includes nails)" },
    ],
  },

  {
    id: "small-animal",
    title: "Small Animal",
    note: "Bunnies & Guinea Pigs only. No birds.",
    items: [
      { name: "Nails", price: "$20" },
    ],
  },
];
