/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function hash(pw) {
  return argon2.hash(pw, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

const DEV_PASSWORD = 'Omerta#2026';

async function seedRolesAndPermissions() {
  const roles = ['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'];
  const permissions = [
    'rooms:read', 'rooms:create', 'rooms:update', 'rooms:delete',
    'bookings:read:own', 'bookings:read:any', 'bookings:create', 'bookings:cancel:own', 'bookings:cancel:any',
    'checkin:perform', 'checkout:perform',
    'payments:read', 'payments:refund',
    'staff:manage', 'customers:manage', 'analytics:read', 'settings:manage',
  ];

  const roleRecords = {};
  for (const name of roles) {
    roleRecords[name] = await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }
  const permRecords = {};
  for (const code of permissions) {
    permRecords[code] = await prisma.permission.upsert({ where: { code }, update: {}, create: { code } });
  }

  const grants = {
    CUSTOMER: ['rooms:read', 'bookings:read:own', 'bookings:create', 'bookings:cancel:own', 'payments:read'],
    STAFF: ['rooms:read', 'bookings:read:any', 'checkin:perform', 'checkout:perform'],
    ADMIN: Object.keys(permRecords).filter((c) => c !== 'settings:manage'),
    SUPER_ADMIN: Object.keys(permRecords),
  };

  for (const [role, codes] of Object.entries(grants)) {
    for (const code of codes) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleRecords[role].id, permissionId: permRecords[code].id } },
        update: {},
        create: { roleId: roleRecords[role].id, permissionId: permRecords[code].id },
      });
    }
  }

  console.log(`Seeded ${roles.length} roles and ${permissions.length} permissions`);
}

async function seedHotelSettings() {
  const settings = [
    { key: 'hotelName', value: 'Luxury Mafia Hotel' },
    { key: 'checkInTime', value: '14:00' },
    { key: 'checkOutTime', value: '11:00' },
    { key: 'cancellationWindowHours', value: 24 },
    { key: 'taxRatePercent', value: 12 },
    { key: 'serviceChargePercent', value: 5 },
    { key: 'contactEmail', value: 'concierge@luxurymafiahotel.com' },
    { key: 'contactPhone', value: '+91-11-4000-1900' },
    { key: 'address', value: 'Via dei Consiglieri 5, New Delhi, India' },
  ];
  for (const s of settings) {
    await prisma.hotelSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log(`Seeded ${settings.length} hotel settings`);
}

async function seedUsers() {
  const superAdmin = await prisma.user.upsert({
    where: { email: 'donvittorio@luxurymafiahotel.com' },
    update: {},
    create: {
      email: 'donvittorio@luxurymafiahotel.com', phone: '+911100000001',
      passwordHash: await hash(DEV_PASSWORD), firstName: 'Vittorio', lastName: 'Contadino',
      role: 'SUPER_ADMIN', isEmailVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@luxurymafiahotel.com' },
    update: {},
    create: {
      email: 'admin@luxurymafiahotel.com', phone: '+911100000002',
      passwordHash: await hash(DEV_PASSWORD), firstName: 'Serafina', lastName: 'Moretti',
      role: 'ADMIN', isEmailVerified: true,
    },
  });

  const staffSeeds = [
    { email: 'frontdesk@luxurymafiahotel.com', firstName: 'Lucia', lastName: 'Bianchi', department: 'FRONT_DESK', position: 'Front Desk Captain', shift: 'MORNING' },
    { email: 'concierge@luxurymafiahotel.com', firstName: 'Salvatore', lastName: 'Greco', department: 'CONCIERGE', position: 'Chief Concierge', shift: 'MORNING' },
    { email: 'housekeeping@luxurymafiahotel.com', firstName: 'Rosa', lastName: 'Ferrara', department: 'HOUSEKEEPING', position: 'Housekeeping Supervisor', shift: 'EVENING' },
  ];

  const staffUsers = [];
  for (const [i, s] of staffSeeds.entries()) {
    const user = await prisma.user.upsert({
      where: { email: s.email }, update: {},
      create: {
        email: s.email, phone: `+91110000001${i}`, passwordHash: await hash(DEV_PASSWORD),
        firstName: s.firstName, lastName: s.lastName, role: 'STAFF', isEmailVerified: true,
      },
    });
    await prisma.staffProfile.upsert({
      where: { userId: user.id }, update: {},
      create: {
        userId: user.id, employeeCode: `LMH-${s.department.slice(0, 2)}-${100 + i}`,
        department: s.department, position: s.position, shift: s.shift,
      },
    });
    staffUsers.push(user);
  }

  const customerSeeds = [
    { email: 'giovanni.rossi@example.com', firstName: 'Giovanni', lastName: 'Rossi', tier: 'PLATINUM' },
    { email: 'isabella.romano@example.com', firstName: 'Isabella', lastName: 'Romano', tier: 'GOLD' },
    { email: 'marco.deluca@example.com', firstName: 'Marco', lastName: 'De Luca', tier: 'SILVER' },
    { email: 'aria.chen@example.com', firstName: 'Aria', lastName: 'Chen', tier: 'DON' },
  ];

  const customers = [];
  for (const [i, c] of customerSeeds.entries()) {
    const user = await prisma.user.upsert({
      where: { email: c.email }, update: {},
      create: {
        email: c.email, phone: `+9198765430${i}`, passwordHash: await hash(DEV_PASSWORD),
        firstName: c.firstName, lastName: c.lastName, role: 'CUSTOMER', isEmailVerified: true,
      },
    });
    await prisma.customerProfile.upsert({
      where: { userId: user.id }, update: {},
      create: { userId: user.id, loyaltyTier: c.tier, preferredView: 'CITY', preferredBed: 'KING' },
    });
    customers.push(user);
  }

  console.log(`Seeded users: 1 super admin, 1 admin, ${staffUsers.length} staff, ${customers.length} customers`);
  return { superAdmin, admin, staffUsers, customers };
}

async function seedAmenities() {
  const amenities = [
    { name: 'Private Plunge Pool', category: 'WELLNESS' },
    { name: 'Private Rooftop Pool', category: 'WELLNESS' },
    { name: 'Private Terrace', category: 'ROOM' },
    { name: 'Wraparound Terrace', category: 'ROOM' },
    { name: 'Dedicated Butler', category: 'HOTEL' },
    { name: 'Dedicated House Team', category: 'HOTEL' },
    { name: 'Walk-in Humidor Lounge', category: 'DINING' },
    { name: 'Cigar Lounge', category: 'DINING' },
    { name: 'Private Elevator Access', category: 'HOTEL' },
    { name: 'Private Dining Room', category: 'DINING' },
    { name: 'In-suite Dining Room', category: 'DINING' },
    { name: 'Rain Shower', category: 'ROOM' },
    { name: 'Steam Room', category: 'WELLNESS' },
    { name: 'Rain Shower & Soaking Tub', category: 'ROOM' },
    { name: 'Study with Fireplace', category: 'ROOM' },
    { name: 'Private Office Nook', category: 'BUSINESS' },
    { name: 'Walk-in Dressing Room', category: 'ROOM' },
    { name: 'Espresso & Decanter Bar', category: 'DINING' },
    { name: 'Espresso Bar', category: 'DINING' },
    { name: 'Express Pressing Service', category: 'HOTEL' },
    { name: 'Soundproofed Suite', category: 'ROOM' },
    { name: 'Reading Corner', category: 'ROOM' },
    { name: 'Terrazzo Bath', category: 'ROOM' },
    { name: 'Minibar & Decanter Set', category: 'DINING' },
    { name: 'Blackout Drapery', category: 'ROOM' },
    { name: 'Turndown Service', category: 'HOTEL' },
    { name: 'Separate Living Room', category: 'ROOM' },
    { name: 'Private Bar Cart', category: 'DINING' },
    { name: 'Nespresso Bar', category: 'DINING' },
    { name: 'Same-day Laundry', category: 'HOTEL' },
    { name: 'Two Bedrooms', category: 'ROOM' },
    { name: 'Shared Salon & Dining Table', category: 'DINING' },
    { name: 'Two Full Baths', category: 'ROOM' },
    { name: 'Kids Amenity Kit', category: 'ROOM' },
    { name: 'Interconnecting Door', category: 'ROOM' },
    { name: 'Private Check-in', category: 'HOTEL' },
    { name: 'Private Cinema Room', category: 'ROOM' },
    { name: 'Full Bar & Cellar', category: 'DINING' },
    { name: 'Helipad Transfer Coordination', category: 'HOTEL' },
    { name: 'In-residence Chef', category: 'DINING' },
  ];

  const created = [];

  for (const a of amenities) {
    created.push(
      await prisma.amenity.upsert({
        where: { name: a.name },
        update: { category: a.category },
        create: a,
      }),
    );
  }

  console.log(`Seeded ${created.length} amenities`);
  return created;
}

async function seedRoomTypesAndRooms(amenities) {
  const amenityByName = new Map(amenities.map((a) => [a.name, a.id]));

  // Keep existing historical data, but remove old development rooms
  // from the customer-facing active inventory.
  await prisma.room.updateMany({
    data: { isActive: false },
  });

  await prisma.roomType.updateMany({
    data: { isActive: false },
  });

  const roomSeeds = [
    {
      roomNumber: '1201',
      name: 'The Don',
      category: 'Presidential Suite',
      description:
        'The Don occupies the entire top corner of the west wing — a private residence disguised as a hotel suite. Black marble runs underfoot from the entry hall to the terrace, where a private plunge pool overlooks the city. Every material was chosen for the family before it was chosen for the guest.',
      price: 78000,
      capacityAdults: 4,
      capacityChildren: 0,
      sizeSqft: 2260,
      bedType: 'KING',
      viewType: 'CITY',
      images: [
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1600&auto=format&fit=crop',
      ],
      floor: 12,
      amenities: [
        'Private Plunge Pool',
        'Dedicated Butler',
        'Walk-in Humidor Lounge',
        'Private Elevator Access',
        'In-suite Dining Room',
        'Rain Shower',
        'Steam Room',
        'Study with Fireplace',
      ],
    },
    {
      roomNumber: '1001',
      name: 'The Capo',
      category: 'Executive Suite',
      description:
        'The Capo is built for those who run something — a business, a family, a room. Walnut panelling frames a private office nook, and the bedroom is set apart by a pivoting brass screen so work and rest never share the same air.',
      price: 42000,
      capacityAdults: 3,
      capacityChildren: 0,
      sizeSqft: 1033,
      bedType: 'KING',
      viewType: 'CITY',
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=1600&auto=format&fit=crop',
      ],
      floor: 10,
      amenities: [
        'Private Office Nook',
        'Walk-in Dressing Room',
        'Espresso & Decanter Bar',
        'Rain Shower',
        'Express Pressing Service',
        'Soundproofed Suite',
      ],
    },
    {
      roomNumber: '801',
      name: 'The Consigliere',
      category: 'Luxury Executive Room',
      description:
        'Named for the trusted advisor, this room is composed rather than grand — deep espresso tones, a reading corner beneath brass sconces, and a bath drawn from black terrazzo. The kind of room where difficult decisions get easier.',
      price: 26000,
      capacityAdults: 2,
      capacityChildren: 0,
      sizeSqft: 624,
      bedType: 'KING',
      viewType: 'COURTYARD',
      images: [
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1611048268330-53de574cae3b?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1600&auto=format&fit=crop',
      ],
      floor: 8,
      amenities: [
        'Reading Corner',
        'Terrazzo Bath',
        'Minibar & Decanter Set',
        'Blackout Drapery',
        'Turndown Service',
      ],
    },
    {
      roomNumber: '701',
      name: 'The Underboss',
      category: 'Premium Suite',
      description:
        'A generous suite with a separated living room, ideal for guests who entertain quietly. Deep burgundy upholstery against dark walnut millwork gives the room its particular gravity.',
      price: 34000,
      capacityAdults: 3,
      capacityChildren: 0,
      sizeSqft: 797,
      bedType: 'KING',
      viewType: 'CITY',
      images: [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1611048268330-53de574cae3b?q=80&w=1600&auto=format&fit=crop',
      ],
      floor: 7,
      amenities: [
        'Separate Living Room',
        'Private Bar Cart',
        'Rain Shower & Soaking Tub',
        'Nespresso Bar',
        'Same-day Laundry',
      ],
    },
    {
      roomNumber: '401',
      name: 'The Family Estate',
      category: 'Luxury Family Residence',
      description:
        'Two bedrooms joined by a shared salon, designed for families who travel as one unit but still expect privacy. A discreet connecting door, a full dining table, and a second bath keep mornings unhurried.',
      price: 56000,
      capacityAdults: 6,
      capacityChildren: 0,
      sizeSqft: 1485,
      bedType: 'SUITE',
      viewType: 'GARDEN',
      images: [
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1600&auto=format&fit=crop',
      ],
      floor: 4,
      amenities: [
        'Two Bedrooms',
        'Shared Salon & Dining Table',
        'Two Full Baths',
        'Kids Amenity Kit',
        'Interconnecting Door',
        'Private Check-in',
      ],
    },
    {
      roomNumber: '1401',
      name: 'The Black Label',
      category: 'Signature Penthouse',
      description:
        'One residence, the entire top floor. A private rooftop pool at night with the skyline for company, a wraparound terrace, and a dedicated house team that exists for this address alone. The Black Label is not booked so much as it is granted.',
      price: 145000,
      capacityAdults: 6,
      capacityChildren: 0,
      sizeSqft: 3659,
      bedType: 'SUITE',
      viewType: 'CITY',
      images: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1600&auto=format&fit=crop',
      ],
      floor: 14,
      amenities: [
        'Private Rooftop Pool',
        'Wraparound Terrace',
        'Dedicated House Team',
        'Private Cinema Room',
        'Full Bar & Cellar',
        'Helipad Transfer Coordination',
        'In-residence Chef',
      ],
    },
  ];

  const rooms = [];

  for (const seed of roomSeeds) {
    let roomType = await prisma.roomType.upsert({
      where: { name: seed.category },
      update: {
        description: seed.description,
        basePrice: seed.price,
        capacityAdults: seed.capacityAdults,
        capacityChildren: seed.capacityChildren,
        sizeSqft: seed.sizeSqft,
        bedType: seed.bedType,
        defaultView: seed.viewType,
        images: seed.images,
        isActive: true,
      },
      create: {
        name: seed.category,
        description: seed.description,
        basePrice: seed.price,
        capacityAdults: seed.capacityAdults,
        capacityChildren: seed.capacityChildren,
        sizeSqft: seed.sizeSqft,
        bedType: seed.bedType,
        defaultView: seed.viewType,
        images: seed.images,
        isActive: true,
      },
    });

    const room = await prisma.room.upsert({
      where: { roomNumber: seed.roomNumber },
      update: {
        name: seed.name,
        roomTypeId: roomType.id,
        description: seed.description,
        floor: seed.floor,
        price: seed.price,
        capacityAdults: seed.capacityAdults,
        capacityChildren: seed.capacityChildren,
        sizeSqft: seed.sizeSqft,
        bedType: seed.bedType,
        viewType: seed.viewType,
        images: seed.images,
        status: 'AVAILABLE',
        isActive: true,
      },
      create: {
        roomNumber: seed.roomNumber,
        name: seed.name,
        roomTypeId: roomType.id,
        description: seed.description,
        floor: seed.floor,
        price: seed.price,
        capacityAdults: seed.capacityAdults,
        capacityChildren: seed.capacityChildren,
        sizeSqft: seed.sizeSqft,
        bedType: seed.bedType,
        viewType: seed.viewType,
        images: seed.images,
        status: 'AVAILABLE',
        isActive: true,
      },
    });

    await prisma.roomAmenity.deleteMany({
      where: { roomId: room.id },
    });

    const amenityRows = seed.amenities.map((name) => ({
      roomId: room.id,
      amenityId: amenityByName.get(name),
    }));

    if (amenityRows.some((row) => !row.amenityId)) {
      const missing = seed.amenities.filter((name) => !amenityByName.has(name));
      throw new Error(`Missing seeded amenities: ${missing.join(', ')}`);
    }

    await prisma.roomAmenity.createMany({
      data: amenityRows,
      skipDuplicates: true,
    });

    rooms.push(room);
  }

  console.log(`Seeded ${roomSeeds.length} active room types and ${rooms.length} active rooms`);
  return rooms;
}

async function main() {
  console.log('Seeding Luxury Mafia Hotel development data...');
  await seedRolesAndPermissions();
  await seedHotelSettings();
  const { customers } = await seedUsers();
  const amenities = await seedAmenities();
  const rooms = await seedRoomTypesAndRooms(amenities);

  console.log('\nDone. Development credentials (all use the same password):');
  console.log(`  Password for every seeded account: ${DEV_PASSWORD}`);
  console.log('  SUPER_ADMIN: donvittorio@luxurymafiahotel.com');
  console.log('  ADMIN:       admin@luxurymafiahotel.com');
  console.log('  STAFF:       frontdesk@luxurymafiahotel.com / concierge@luxurymafiahotel.com / housekeeping@luxurymafiahotel.com');
  console.log('  CUSTOMER:    giovanni.rossi@example.com / isabella.romano@example.com / marco.deluca@example.com / aria.chen@example.com');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
