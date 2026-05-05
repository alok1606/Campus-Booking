require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding');
};

const seed = async () => {
  await connectDB();

  // Clear collections
  await Promise.all([User.deleteMany(), Resource.deleteMany(), Event.deleteMany(), Booking.deleteMany()]);
  console.log('Collections cleared');

  // Create users
  const users = await User.create([
    { name: 'Admin User', email: 'admin@campus.edu', password: 'Admin@123', role: 'admin', department: 'Administration' },
    { name: 'Dr. Himanshu Agrawal', email: 'faculty@campus.edu', password: 'Faculty@123', role: 'faculty', department: 'Computer Science' },
    { name: 'Arvind Shekhawat', email: 'student@campus.edu', password: 'Student@123', role: 'student', department: 'Computer Science' },
    { name: 'Vishal Rajput', email: 'anita@campus.edu', password: 'Student@123', role: 'student', department: 'Electronics' },
  ]);
  console.log('Users seeded:', users.length);

  const [admin, faculty, student1, student2] = users;

  // Create resources
  const resources = await Resource.create([
    { name: 'Main Auditorium', type: 'auditorium', description: 'Large auditorium for 500+ attendees', capacity: 500, location: 'Block A, Ground Floor', amenities: ['Projector', 'PA System', 'AC', 'Stage Lights'], isAvailable: true, createdBy: admin._id },
    { name: 'Seminar Hall 101', type: 'hall', description: 'Seminar hall for departmental meetings', capacity: 80, location: 'Block B, 1st Floor', amenities: ['Projector', 'Whiteboard', 'AC'], isAvailable: true, createdBy: admin._id },
    { name: 'Computer Lab 3', type: 'lab', description: 'Fully equipped computer lab with 40 systems', capacity: 40, location: 'Block C, 2nd Floor', amenities: ['40 PCs', 'Projector', 'Internet', 'AC'], isAvailable: true, createdBy: admin._id },
    { name: 'Classroom 201', type: 'classroom', description: 'Standard classroom for lectures', capacity: 60, location: 'Block A, 2nd Floor', amenities: ['Projector', 'Whiteboard'], isAvailable: true, createdBy: admin._id },
    { name: 'Sports Ground', type: 'ground', description: 'Open ground for sports events', capacity: 200, location: 'Campus Grounds', amenities: ['Floodlights', 'Seating Area'], isAvailable: true, createdBy: admin._id },
    { name: 'Projector Kit A', type: 'equipment', description: 'Portable projector with stand', capacity: 1, location: 'Equipment Store', amenities: [], isAvailable: true, createdBy: admin._id },
  ]);
  console.log('Resources seeded:', resources.length);

  // Create events
  const now = new Date();
  const events = await Event.create([
    {
      title: 'Annual Tech Symposium 2024', description: 'Annual technology symposium featuring keynote speakers and project exhibitions.',
      category: 'technical', status: 'approved', organizer: faculty._id,
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      venue: 'Main Auditorium', expectedAttendees: 400, reviewedBy: admin._id, reviewedAt: new Date(),
      tags: ['technology', 'symposium', 'projects']
    },
    {
      title: 'Cultural Fest - Rang Utsav', description: 'Annual cultural festival with music, dance, and art competitions.',
      category: 'cultural', status: 'submitted', organizer: student1._id,
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      venue: 'Sports Ground', expectedAttendees: 300, tags: ['culture', 'music', 'dance']
    },
    {
      title: 'Python Workshop', description: 'Hands-on workshop on Python programming for beginners.',
      category: 'workshop', status: 'approved', organizer: faculty._id,
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      venue: 'Computer Lab 3', expectedAttendees: 35, reviewedBy: admin._id, reviewedAt: new Date(),
      tags: ['python', 'programming', 'workshop']
    },
    {
      title: 'Sports Day 2024', description: 'Inter-department sports competition.',
      category: 'sports', status: 'draft', organizer: student2._id,
      startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
      venue: 'Sports Ground', expectedAttendees: 200, tags: ['sports', 'inter-department']
    },
  ]);
  console.log('Events seeded:', events.length);

  // Create bookings
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  await Booking.create([
    {
      resource: resources[0]._id, requestedBy: faculty._id, event: events[0]._id,
      title: 'Tech Symposium Setup', purpose: 'Setting up auditorium for annual tech symposium',
      startTime: new Date(tomorrow.getTime()), endTime: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000),
      attendees: 400, status: 'approved', approvedBy: admin._id, approvedAt: new Date()
    },
    {
      resource: resources[2]._id, requestedBy: student1._id,
      title: 'ML Project Demo', purpose: 'Final year project demonstration',
      startTime: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      attendees: 15, status: 'pending'
    },
    {
      resource: resources[1]._id, requestedBy: student2._id,
      title: 'Club Meeting', purpose: 'Monthly robotics club meeting',
      startTime: new Date(tomorrow.getTime() + 1 * 24 * 60 * 60 * 1000),
      endTime: new Date(tomorrow.getTime() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      attendees: 25, status: 'rejected', rejectionReason: 'Hall already reserved for faculty meeting',
      approvedBy: faculty._id, approvedAt: new Date()
    },
  ]);
  console.log('Bookings seeded');

  console.log('\n✅ Seeding complete!');
  console.log('─────────────────────────────');
  console.log('Login credentials:');
  console.log('  Admin:   admin@campus.edu    / Admin@123');
  console.log('  Faculty: faculty@campus.edu  / Faculty@123');
  console.log('  Student: student@campus.edu  / Student@123');
  console.log('─────────────────────────────');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
