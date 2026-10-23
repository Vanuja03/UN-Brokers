import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb } from '../config/db.js';
import { PolicyRenewal } from '../models/PolicyRenewal.js';

const insurers = [
  'Sri Lanka Insurance',
  'Ceylinco VIP',
  'Fairfirst Insurance',
  'LOLC General Insurance',
  'Allianz Insurance',
  'HNB General Insurance',
  'Continental Life',
  'Co-operative Insurance',
  'Sanasa General',
  'Amana Takaful',
];

const customers = [
  'Nimal Perera',
  'Kumari Silva',
  'Ajith Fernando',
  'Sanduni Jayasinghe',
  'Ruwan Bandara',
  'Dilani Wijesinghe',
  'Chaminda Rathnayake',
  'Ishara Gunasekara',
  'Tharindu Abeysekara',
  'Madhavi Herath',
  'Kasun Dissanayake',
  'Anusha Pathirana',
  'Dinesh Alwis',
  'Gayani Senanayake',
  'Pradeep Karunaratne',
  'Nishadi Ekanayake',
  'Harsha Mendis',
  'Chamari Liyanage',
  'Suresh Weerasinghe',
  'Nilmini Rajapaksha',
];

const towns = [
  '12 Temple Road, Colombo 07',
  '45 Galle Road, Mount Lavinia',
  '8 Kandy Road, Kadawatha',
  '21 Beach Road, Galle',
  '6 Station Road, Negombo',
  '14 Lake Road, Kandy',
  '33 Main Street, Kurunegala',
  '9 Hospital Road, Matara',
  '18 Queens Road, Jaffna',
  '27 New Town, Anuradhapura',
  '4 Hill Street, Nuwara Eliya',
  '51 Bazaar Street, Ratnapura',
  '16 Circular Road, Batticaloa',
  '39 Church Street, Badulla',
  '2 Harbour Road, Trincomalee',
  '11 Market Road, Chilaw',
  '28 Park Road, Kalutara',
  '7 School Lane, Panadura',
  '62 Cross Street, Moratuwa',
  '19 Temple Lane, Homagama',
];

const salesPeople = ['Kasun Fernando', 'Nadeesha Perera', 'Imesh Silva', 'Dilani Jayawardena'];
const speciCo = ['', 'Fleet', 'Lease', 'Private'];
const plates = ['WP', 'CP', 'SP', 'NW', 'SG', 'EP', 'NP', 'NC'];

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

function lastDay(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function sampleRows() {
  return customers.map((customerName, index) => {
    const month = (index % 12) + 1;
    const year = index < 12 ? 2026 : 2025;
    const number = String(index + 1).padStart(2, '0');
    return {
      policyNumber: `UNB-S-${number}`,
      vehicleNumber: `${plates[index % plates.length]} CAB-${2400 + index}`,
      fromDate: utcDate(year - 1, month, 1),
      toDate: utcDate(year, month, lastDay(year, month)),
      customerName,
      postalAddress: towns[index],
      sumInsured: 1_800_000 + index * 250_000,
      lastYearPremium: 42_000 + index * 1_500,
      thisYearPremium: 45_000 + index * 1_750,
      insuranceCompany: insurers[index % insurers.length],
      salesPerson: salesPeople[index % salesPeople.length],
      speciCo: speciCo[index % speciCo.length],
      status: index % 5 === 0 ? 'new' : 'ren',
      contactNo: `07120010${number}`,
      remarks: 'Sample policy for the renewal list.',
    };
  });
}

export async function seedPolicyRenewals() {
  for (const row of sampleRows()) {
    await PolicyRenewal.updateOne({ policyNumber: row.policyNumber }, { $set: row }, { upsert: true });
  }
}

async function main() {
  await connectDb();
  await seedPolicyRenewals();
  console.log('Saved 20 sample policy renewals.');
  process.exit(0);
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
if (invoked) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Sample policies could not be saved.');
    process.exit(1);
  });
}
