"use client";

// eslint-disable-next-line no-unused-vars
import React, { useEffect } from "react";
import Style from "./styles/PrivacyPolicy.module.scss";

function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={Style.background}>
      <div className={Style.main}>
        <div className={Style.heading}>
          <h1
            className={Style.privacy}
            style={{
              background: "var(--primary)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Privacy
          </h1>
          <h1>Policies</h1>
        </div>
        <p>
          This Privacy Policy describes how{" "}
          <strong>Federation of Entrepreneurship</strong> collects, uses,
          stores, and protects the personal information of its members.Please
          read this policy carefully to understand our practices regarding your
          personal data.
        </p>
        <p>
          <strong
            style={{
              background: "var(--primary)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            1. Information We Collect:
          </strong>
          <br />
          <br />
          a. Personal Information: We may collect personal information, such as
          your name, contact details (email address, phone number), and college
          ID, when you join <strong>Federation of Entrepreneurship</strong>.
          <br />
          b. Non-Personal Information: We may also collect non-personal
          information, such as demographic data and preferences, to better
          understand our members and improve our services.
        </p>
        <p>
          <strong
            style={{
              background: "var(--primary)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            {" "}
            2. Collection and Use of Information:
          </strong>
          <br />
          <br />
          a. We collect personal information to maintain a membership database,
          communicate with members, and organize society activities effectively.
          <br />
          b. We may use your email address or phone number to send updates,
          event invitations, newsletters, and other society-related
          communications.
          <br />
          c. Non-personal information may be used for statistical analysis,
          research, and improving our services.
        </p>
        <p>
          <strong
            style={{
              background: "var(--primary)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            3. Information Sharing and Disclosure:
          </strong>
          <br />
          <br />
          a. We may share your personal information with trusted third parties
          who assist us in organizing events, managing communications, or
          providing necessary services to{" "}
          <strong>Federation of Entrepreneurship </strong>. These third parties
          are bound by confidentiality agreements and are not permitted to use
          your personal information for any other purpose.
          <br />
          b. We may disclose your personal information if required to do so by
          law or if we believe that such disclosure is necessary to protect our
          rights, comply with legal obligations, or safeguard the safety of our
          members.
        </p>
        <p>
          <strong
            style={{
              background: "var(--primary)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            4. Data Security:
          </strong>
          <br />
          <br />
          a. We implement reasonable security measures to protect your personal
          information from unauthorized access, disclosure, alteration, or
          destruction.
          <br />
          b. However, please note that no method of data transmission over the
          internet or electronic storage is completely secure. We cannot
          guarantee the absolute security of your personal information.
        </p>
        <p>
          <strong
            style={{
              background: "var(--primary)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            5. Data Retention:
          </strong>
          <br />
          <br />
          a. We will retain your personal information only for as long as
          necessary to fulfill the purposes for which it was collected and to
          comply with applicable laws and regulations.
          <br />
          b. If you wish to request the deletion of your personal information
          from our records, please contact us using the information provided
          below.
        </p>
        <p>
          <strong
            style={{
              background: "var(--primary)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            6. Your Rights:
          </strong>
          <br />
          <br />
          a. You have the right to access, update, and correct your personal
          information. If you would like to exercise these rights, please
          contact us using the information provided below.
          <br />
          b. You may also choose to unsubscribe from our communications or
          opt-out of certain data collection activities by following the
          instructions provided in our communications or by contacting us
          directly.
        </p>
        <p>
          <strong
            style={{
              background: "var(--primary)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            7. Third-Party Links:
          </strong>
          <br />
          <br />
          Our website or communications may contain links to third-party
          websites or services. We are not responsible for the privacy practices
          or content of such third parties. We encourage you to review the
          privacy policies of those third parties before providing any personal
          information.
        </p>
        <p>
          <strong
            style={{
              background: "var(--primary)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            8. Changes to the Privacy Policy:
          </strong>
          <br />
          <br /> We reserve the right to modify or update this Privacy Policy
          from time to time. Any changes will be effective when we post the
          revised policy. We encourage you to review this Privacy Policy
          periodically.
        </p>
        <p>
          <strong
            style={{
              background: "var(--primary)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            9. Contact Us:
          </strong>
          <br />
          <br />
          If you have any questions, concerns, or requests regarding this
          Privacy Policy or the handling of your personal information, please
          contact us at <strong><u>fedkiit@gmail.com.</u></strong>
        </p>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
