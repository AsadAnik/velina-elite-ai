// Bangladesh districts grouped for Dhaka vs Outside detection
export const BANGLADESH_CITIES = [
  // Dhaka Division (Dhaka city specifically at top)
  "Dhaka",
  "Narayanganj",
  "Gazipur",
  "Munshiganj",
  "Manikganj",
  "Narsingdi",
  "Tangail",
  "Kishoreganj",
  "Netrokona",
  "Mymensingh",
  "Jamalpur",
  "Sherpur",
  // Chittagong Division
  "Chittagong",
  "Cox's Bazar",
  "Noakhali",
  "Comilla",
  "Feni",
  "Lakshmipur",
  "Brahmanbaria",
  "Chandpur",
  "Khagrachhari",
  "Rangamati",
  "Bandarban",
  // Rajshahi Division
  "Rajshahi",
  "Bogra",
  "Joypurhat",
  "Naogaon",
  "Natore",
  "Nawabganj",
  "Pabna",
  "Sirajganj",
  // Khulna Division
  "Khulna",
  "Bagerhat",
  "Satkhira",
  "Jessore",
  "Magura",
  "Jhenaidah",
  "Narail",
  "Kushtia",
  "Chuadanga",
  "Meherpur",
  // Barisal Division
  "Barisal",
  "Bhola",
  "Jhalokati",
  "Patuakhali",
  "Pirojpur",
  "Borguna",
  // Sylhet Division
  "Sylhet",
  "Habiganj",
  "Moulvibazar",
  "Sunamganj",
  // Rangpur Division
  "Rangpur",
  "Dinajpur",
  "Gaibandha",
  "Kurigram",
  "Lalmonirhat",
  "Nilphamari",
  "Panchagarh",
  "Thakurgaon",
  // Mymensingh Division
  "Netrokona",
];

export const DHAKA_CITIES = new Set([
  "Dhaka",
  "Narayanganj",
  "Gazipur",
  "Munshiganj",
  "Manikganj",
  "Narsingdi",
]);

export function isDhakaCity(city: string): boolean {
  return DHAKA_CITIES.has(city);
}

export const COUNTRIES = ["Bangladesh"];
