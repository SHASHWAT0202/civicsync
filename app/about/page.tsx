import MainLayout from "@/components/MainLayout";
import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  const teamMembers = [
    {
      id: 1,
      name: 'Shashwat Ranjan',
      role: 'Team-Lead, Fullstack Developer',
      image: '/team-member-1.jpg',
      description: 'As a Team Lead, Shashwat led the development of CivicSync, ensuring end-to-end functionality and performance. With expertise across front-end and back-end, he specialize in building scalable, user-focused solutions.',
      linkedin: 'https://www.linkedin.com/in/shashwat-ranjan-6a157728a/'
    },
    {
      id: 2,
      name: 'Swasti Shukla',
      role: 'UI-UX Designer, Research Analysist',
      image: '/team-member-2.jpg',
      description: 'Swasti is professionally certified by Google in UX Design. As a research analysist, she dived into civic engagement and digital participation challenges to come up with CivicSync, creating seamless interfaces backed by strong analytical strategies.',
      linkedin: 'https://www.linkedin.com/in/swasti-shukla-01164228a/'
    },
    
    {
      id: 3,
      name: 'Sabhya Rajvanshi',
      role: 'Data and API Engineer',
      image: '/team-member-3.jpg',
      description: 'Sabhya manages data processes and ensuring efficient integration, enabling smooth and reliable performance throughout the platform. He plays a key role in maintaining performance and data reliability.',
      linkedin: 'https://www.linkedin.com/in/sabhya-rajvanshi-09129328b'
    }
  ];

  const values = [
    {
      title: "Transparency",
      description: "We believe in open communication and visibility throughout the complaint resolution process, building trust between citizens and authorities.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    },
    {
      title: "Accountability",
      description: "We promote responsibility at all levels, ensuring that reported issues are addressed efficiently and effectively.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "Community Engagement",
      description: "We encourage active citizen participation in identifying and resolving community issues, fostering a sense of ownership and pride.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "Innovation",
      description: "We continuously improve our platform, leveraging technology to make civic engagement more accessible and effective.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    }
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold">About CivicSync</h1>
            <p className="mt-6 text-xl text-blue-100 max-w-3xl mx-auto">
              Empowering communities through civic engagement and technology
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            <div className="mt-6 text-lg text-gray-600">
              <p>
                At CivicSync, our mission is to bridge the gap between citizens and local authorities, creating a more responsive and efficient system for addressing community issues. We believe that by leveraging technology, we can empower citizens to actively participate in improving their neighborhoods and communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Our Story</h2>
              <div className="mt-6 text-lg text-gray-600 space-y-4">
                <p>
                  CivicSync was born out of a simple observation: citizens often face challenges when trying to report and track the resolution of civic issues. Traditional methods of complaint registration are often cumbersome, lack transparency, and don't provide adequate feedback mechanisms.
                </p>
                <p>
                  Our team of civic-minded technologists came together to create a platform that makes it easy for citizens to report issues, track their progress, and provide feedback on resolutions. By creating a transparent and accessible system, we aim to foster greater trust between citizens and local authorities.
                </p>
              </div>
            </div>
            <div className="mt-12 lg:mt-0">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="relative h-80 w-full overflow-hidden">
                  <Image 
                    src="/images/placeholder.jpg" 
                    alt="CivicSync Story" 
                    width={800}
                    height={600}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center">How We Work</h2>
          
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* For Citizens */}
            <div className="bg-blue-50 rounded-xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-blue-700 mb-6">For Citizens</h3>
              <ul className="space-y-4">
                {[
                  { text: "Register complaints with detailed descriptions, images, and precise location data", icon: "📝" },
                  { text: "Track the status of complaints from submission to resolution", icon: "🔍" },
                  { text: "Vote on issues that matter most to their community", icon: "👍" },
                  { text: "Provide feedback on the resolution process", icon: "💬" },
                  { text: "Earn recognition through badges for active participation", icon: "🏆" }
                ].map((item, i) => (
                  <li key={i} className="flex">
                    <span className="mr-4 text-2xl">{item.icon}</span>
                    <span className="text-gray-700">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Authorities */}
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-700 mb-6">For Authorities</h3>
              <ul className="space-y-4">
                {[
                  { text: "Access a comprehensive dashboard of all reported issues", icon: "📊" },
                  { text: "Prioritize issues based on community votes and urgency", icon: "⚡" },
                  { text: "Update the status of complaints as they progress toward resolution", icon: "🔄" },
                  { text: "Identify patterns and recurring issues to inform long-term planning", icon: "📈" },
                  { text: "Build trust with citizens through transparent communication", icon: "🤝" }
                ].map((item, i) => (
                  <li key={i} className="flex">
                    <span className="mr-4 text-2xl">{item.icon}</span>
                    <span className="text-gray-700">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center">Our Values</h2>
          <p className="mt-4 text-lg text-gray-600 text-center max-w-3xl mx-auto">
            The core principles that guide our mission and shape our platform
          </p>
          
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition duration-300">
                <div className="h-14 w-14 rounded-lg bg-blue-50 flex items-center justify-center mb-5">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Meet Our Team</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Passionate professionals dedicated to improving community engagement and civic participation
            </p>
          </div>
          
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition duration-300">
                <div className="relative h-80 w-full">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-4">{member.role}</p>
                  <p className="text-gray-600 text-sm mb-4">{member.description}</p>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    Connect
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold">Join Us in Making a Difference</h2>
          <p className="mt-4 text-xl text-blue-100 max-w-3xl mx-auto">
            Together, we can build stronger, more responsive communities where citizens' voices are heard and civic issues are addressed efficiently.
          </p>
          <div className="mt-8">
            <Link
              href="/sign-up"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}