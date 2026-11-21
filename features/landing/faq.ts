export interface FaqGroup {
  id: string;
  title: string;
  items: { question: string; answer: string }[];
}

// Each answer describes what the app does today. Update them when behaviour changes.
export const FAQ: FaqGroup[] = [
  {
    id: "search",
    title: "Searching",
    items: [
      {
        question: "Do I need an account to search for courses?",
        answer:
          "No. Anyone can search the catalogue and open a course. To see which students offer help with it, log in.",
      },
      {
        question: "What can I search for?",
        answer:
          "Course codes, with or without the space (CIS 3400 or CIS3400), course titles, and words from the course description. You can also filter by department.",
      },
      {
        question: "Where do the courses come from?",
        answer:
          "From the Baruch College course catalogue. Course pages link to the official catalogue entry when one is available.",
      },
    ],
  },
  {
    id: "account",
    title: "Accounts",
    items: [
      {
        question: "How do I create an account?",
        answer:
          "Sign up with your first and last name, email and a password. We’ll email you a verification code to confirm your address, and then you can log in.",
      },
      {
        question: "Why is there a security check when I log in?",
        answer:
          "A quick check from Cloudflare helps keep automated sign-ups out. Most of the time it runs in the background without you doing anything.",
      },
      {
        question: "Is FindMyStudents free?",
        answer: "Yes. There are no payments or subscriptions.",
      },
    ],
  },
  {
    id: "offers",
    title: "Help Offers",
    items: [
      {
        question: "What is a Help Offer?",
        answer:
          "A course you’ve said you can help other students with. It shows on your profile, and you appear in that course’s list of students offering help.",
      },
      {
        question: "How many courses can I offer help with?",
        answer:
          "Up to 15 at a time. Adding or removing a course saves straight away, so you can change them whenever you like.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Profiles & privacy",
    items: [
      {
        question: "Who can see my profile?",
        answer:
          "Students who are logged in. They see your first name and last initial, picture, bio and Help Offers. Visitors who aren’t logged in can’t open profiles, and on a course page they only see how many students offer help.",
      },
      {
        question: "Who can see my contact details?",
        answer:
          "Only you, for now. Your phone number, Discord and Instagram are optional and aren’t shown to other students.",
      },
      {
        question: "What profile picture can I upload?",
        answer:
          "A JPEG or PNG up to 5 MB. It’s checked before it appears, location and other photo details are removed, and it’s shown only to logged-in students.",
      },
      {
        question: "Is this an official Baruch College service?",
        answer:
          "No. FindMyStudents is an independent project built by Baruch students for the Baruch community.",
      },
    ],
  },
];
