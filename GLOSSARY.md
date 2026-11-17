# FindMyStudents

Students find other students who volunteer to help with their courses.

## Language

**Course**:
An entry in a school's course catalogue, identified by its course code and shared across instructors and sections. Students volunteer to help with the course as a whole.
_Avoid_: Class (ambiguous with a particular section)

**Volunteer**:
A student who has at least one current **Help Offer**.
_Avoid_: Participant (ambiguous about whether the student is offering or seeking help)

**Help Offer**:
A student's current offer to help other students with one **Course**. It carries no course-specific note. A student adds or removes Help Offers; only current offers are kept, with no history of past help.
_Avoid_: Class, Section, Assignment

**Profile**:
What other students can see about a student: their name (first name and last initial), profile picture, bio, Help Offers and, with a **Connection**, their contact details. Every student has one.
_Avoid_: Account (the login identity, which other students never see)

**Connection Request**:
A student's request to a **Volunteer**, about one **Course**, to see the Volunteer's contact details. The Volunteer accepts or declines it.
_Avoid_: Contact Request

**Connection**:
What an accepted **Connection Request** creates: the requester can see the Volunteer's contact details. It is one-way, and the Volunteer can revoke it.
_Avoid_: Contact Access
