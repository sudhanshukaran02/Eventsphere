export const demoEvents = [
  {
    _id: "demo-event-1",
    title: "EDM Night Festival",
    description: "Get ready for the loudest EDM night festival of the season! Featuring award-winning international headliners, high-powered bass lasers, stellar visual production, and non-stop energetic dance tracks. Experience the nightlife music magic.",
    category: "Music",
    location: "Mumbai, India",
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    price: 999,
    bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    totalTickets: 1500,
    availableTickets: 650,
    ticketsSold: 850,
    views: 3420,
    rating: 4.9,
    reviewsCount: 242,
    organizerId: {
      _id: "demo-org-1",
      name: "Sub Bass Records",
      email: "booking@subbass.in"
    }
  },
  {
    _id: "demo-event-2",
    title: "Tech Summit 2024",
    description: "Connect with the developers, founders, and investors shaping the digital landscape. Discover panels on generative intelligence models, cloud architecture scaling, Web3, and UI/UX design. Under interactive neon spotlight stages.",
    category: "Tech",
    location: "Bangalore, India",
    startDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
    price: 499,
    bannerUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800",
    totalTickets: 1000,
    availableTickets: 400,
    ticketsSold: 600,
    views: 1890,
    rating: 4.8,
    reviewsCount: 164,
    organizerId: {
      _id: "demo-org-2",
      name: "Neo Bangalore Devs",
      email: "summit@neoblr.org"
    }
  },
  {
    _id: "demo-event-3",
    title: "Art & Creativity Expo",
    description: "Explore a stunning gallery of abstract expressionism, digital installations, and interactive neon sculpture designs. Engage in panel discussions with local curators and artists. Complimentary mocktails are included.",
    category: "Art",
    location: "Delhi, India",
    startDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    price: 0,
    bannerUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800",
    totalTickets: 500,
    availableTickets: 0,
    ticketsSold: 500,
    views: 1250,
    rating: 4.7,
    reviewsCount: 98,
    organizerId: {
      _id: "demo-org-3",
      name: "Apex Curators Guild",
      email: "delhiart@apexexpo.org"
    }
  },
  {
    _id: "demo-event-4",
    title: "Rock Live Concert",
    description: "Experience the adrenaline of live guitars, drums, and heavy vocals from top independent rock bands. High-contrast smoke machines and red strobe lights create the ultimate concert arena experience.",
    category: "Music",
    location: "Pune, India",
    startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    price: 799,
    bannerUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=800",
    totalTickets: 800,
    availableTickets: 180,
    ticketsSold: 620,
    views: 2420,
    rating: 4.9,
    reviewsCount: 182,
    organizerId: {
      _id: "demo-org-4",
      name: "Rock Arena Group",
      email: "tickets@rockarena.in"
    }
  },
  {
    _id: "demo-event-5",
    title: "Gourmet Street Food Beat",
    description: "Savor street-style food delicacies from over 40 independent chefs and brewers. Featuring local Goan seafood grills, microbrew IPAs, live acoustic sessions, and outdoor sunset games.",
    category: "Food",
    location: "Goa, India",
    startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000).toISOString(),
    price: 299,
    bannerUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
    totalTickets: 600,
    availableTickets: 150,
    ticketsSold: 450,
    views: 1140,
    rating: 4.6,
    reviewsCount: 88,
    organizerId: {
      _id: "demo-org-5",
      name: "Sun and Sand Feasts",
      email: "sunset@feastgoa.com"
    }
  },
  {
    _id: "demo-event-6",
    title: "Clash of Champions Soccer",
    description: "Witness the final championship battle under the MetLife stadium floodlights! Featuring food stalls, official merchandise booths, and half-time entertainment programs.",
    category: "Sports",
    location: "Kolkata, India",
    startDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    price: 599,
    bannerUrl: "https://images.unsplash.com/photo-1431324155629-1a6edd1d141d?auto=format&fit=crop&q=80&w=800",
    totalTickets: 2000,
    availableTickets: 200,
    ticketsSold: 1800,
    views: 2980,
    rating: 4.8,
    reviewsCount: 196,
    organizerId: {
      _id: "demo-org-6",
      name: "Arena India League",
      email: "info@arenaindia.in"
    }
  }
];
