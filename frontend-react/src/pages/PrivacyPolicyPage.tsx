import LegalPage from '@/components/legal/LegalPage';

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="May 2026"
      intro={
        <>
          <p>
            Solo, operating on <strong>solotestsite.site</strong>, is strongly committed to
            respecting the privacy of all individuals using our website, mobile application,
            and online retail services.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, store, protect, and disclose
            any personally identifiable information that you provide to us through our
            website, mobile application, email, customer service channels, or any other
            means of communication with us.
          </p>
          <p>
            Please read this Privacy Policy carefully to understand our practices regarding
            your information. By using our website, mobile application, or purchasing
            products from us, you agree to the collection and use of your information in
            accordance with this Privacy Policy.
          </p>
        </>
      }
      sections={[
        {
          heading: 'Your Express Consent to Collection',
          body: [
            'We may collect and process the following information about you:',
            <ul key="collect">
              <li>Information you provide by filling in forms on our website or mobile application, including information provided when creating an account, placing an order, subscribing to our services, or contacting customer support.</li>
              <li>Details of purchases and transactions you complete through our website or mobile application.</li>
              <li>Your name, contact number, email address, billing address, shipping address, and payment-related details.</li>
              <li>Records of correspondence if you contact us by email, phone, WhatsApp, social media, or any other communication channel.</li>
              <li>General, demographic, and non-personal information.</li>
              <li>Information you provide when participating in promotions, offers, competitions, reviews, testimonials, surveys, or feedback forms.</li>
              <li>Information you provide when reporting a problem with our website, mobile application, products, or services.</li>
              <li>Details about your device, including IP address, operating system, browser type, and general internet usage.</li>
              <li>Information collected through cookies, tracking pixels, web beacons, or similar technologies.</li>
              <li>Your email address and/or mobile number if shared with us by a third party where you have consented to such sharing.</li>
              <li>Any other information we consider necessary to improve your shopping experience and provide better retail services.</li>
            </ul>,
          ],
        },
        {
          heading: 'Your Express Consent for Use of Your Information',
          body: [
            'We may use your information for the following purposes:',
            <ul key="use">
              <li>To process, confirm, fulfil, and deliver your orders.</li>
              <li>To provide customer support and respond to your questions, requests, or complaints.</li>
              <li>To manage payments, refunds, returns, exchanges, and order-related services.</li>
              <li>To provide you with information about our products, offers, promotions, and services.</li>
              <li>To personalise your shopping experience on our website or mobile application.</li>
              <li>To improve our website, mobile application, product selection, customer service, and overall retail experience.</li>
              <li>To notify you about order updates, delivery status, account activity, service updates, or policy changes.</li>
              <li>To administer promotions, rewards, discounts, competitions, or loyalty programs.</li>
              <li>To ensure that content on our website or mobile application is presented effectively for you and your device.</li>
              <li>To protect our business, customers, website, and services against fraud, unauthorised transactions, or misuse.</li>
              <li>To comply with legal, regulatory, accounting, or operational requirements.</li>
              <li>For any other purpose necessary to enhance your shopping experience with us.</li>
            </ul>,
          ],
        },
        {
          heading: 'Disclosure of Information to Third Parties',
          body: [
            'Customer information is an important part of our business. We share your information only as described below and only with parties that are expected to handle your information securely and responsibly.',
            <strong key="t1">Third-Party Service Providers</strong>,
            'To operate our retail business and provide our services, we may work with affiliated and non-affiliated service providers, including but not limited to:',
            <ul key="sp">
              <li>Delivery and logistics companies.</li>
              <li>Payment processors.</li>
              <li>IT and website service providers.</li>
              <li>Marketing and communication service providers.</li>
              <li>Customer support providers.</li>
              <li>Data storage and hosting providers.</li>
              <li>Professional advisors, where required.</li>
            </ul>,
            'These service providers may need access to relevant information in order to perform their services, such as delivering your order, processing your payment, sending order notifications, or supporting customer service requests.',
            'By using our website or mobile application, you consent to the transfer, storage, use, and disclosure of your information to such service providers where necessary to complete your purchase and support your customer experience.',
          ],
        },
        {
          heading: 'Marketing Communications',
          body: [
            'We may use your information to provide you with updates about products, services, special offers, promotions, new arrivals, events, or features that may be of interest to you.',
            'We may contact you through email, SMS, phone calls, WhatsApp messages, push notifications, web notifications, in-app messages, or other communication channels.',
            'You may opt out of marketing communications at any time by following the unsubscribe instructions in our messages or by contacting us directly.',
          ],
        },
        {
          heading: 'Business Transfers',
          body: [
            'If our business, or substantially all of our assets, are acquired, merged, reorganised, or transferred, customer information may be included as part of the transferred business assets.',
          ],
        },
        {
          heading: 'Legal Protection and Compliance',
          body: [
            'We may disclose account and personal information when we believe such disclosure is necessary to comply with the law, regulatory requirements, legal proceedings, law enforcement requests, or to protect the rights, property, and safety of our customers, employees, business, or others.',
            'This may include sharing information for fraud protection, credit risk reduction, dispute resolution, and security purposes.',
          ],
        },
        {
          heading: 'Third-Party Links',
          body: [
            'Our website or mobile application may contain links to third-party websites.',
            'If you follow a link to any third-party website, please note that those websites have their own privacy policies. We are not responsible or liable for those policies or the way third parties handle your information.',
            'Please review third-party privacy policies before submitting any personal information to those websites.',
          ],
        },
        {
          heading: 'Securing Your Information',
          body: [
            'The information we collect from you may be transferred to, stored, and processed by our employees, contractors, suppliers, or service providers.',
            'Such parties may be involved in fulfilling your orders, processing payments, handling deliveries, providing customer support, or improving our services.',
            'We will retain your information for as long as necessary to fulfil the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by law.',
            'Your information may be transferred, stored, processed, and used by our affiliated companies and/or non-affiliated service providers in one or more countries, where necessary for business operations.',
          ],
        },
        {
          heading: 'Application of Security Measures',
          body: [
            'We maintain commercially reasonable technical, administrative, and physical safeguards to protect your information against unauthorised access, alteration, disclosure, or destruction.',
            'These safeguards may include encryption technology, firewalls, secure servers, access controls, and internal data protection procedures.',
            'Only authorised employees, contractors, and service providers who need access to your information for business purposes are permitted to access it.',
            'You are responsible for keeping your account password and login details confidential. Please ensure that you log out after using a shared device.',
            'Although we take reasonable steps to protect your information, transmission of information over the internet is not completely secure. Any transmission of information is at your own risk.',
          ],
        },
        {
          heading: 'Data Protection Choices and Rights',
          body: [
            'Under certain circumstances, you may have the following rights:',
            <strong key="r1">Request Rectification</strong>,
            'You may request correction of incomplete or inaccurate personal data that we hold about you. This enables you to have any incomplete or inaccurate data corrected. We may need to verify the accuracy of the new information you provide.',
            <strong key="r2">Request Erasure</strong>,
            'You may request deletion of your personal data where there is no valid reason for us to continue processing it. However, we may not always be able to comply with your request if we are required to retain certain information for legal, regulatory, accounting, fraud prevention, or business purposes.',
            <strong key="r3">Request Non-Processing of Personal Data</strong>,
            'You may request that we stop processing your personal data for direct marketing purposes, including profiling related to direct marketing.',
            <strong key="r4">Request Restriction of Processing</strong>,
            'You may request that we suspend processing of your personal data in certain situations, including where you want us to verify the accuracy of your data; our use of the data is unlawful but you do not want us to delete it; you need us to keep the data to establish, exercise, or defend legal claims; or you have objected to our use of your data and we need to verify whether we have overriding legitimate grounds to continue using it.',
            <strong key="r5">Personal Data Portability</strong>,
            'Where applicable, you may request to receive your personal data in a structured, commonly used, machine-readable format, or request that we transfer it to a third party chosen by you. This right applies where the processing is based on your consent or where the processing is necessary for the performance of a contract.',
            <strong key="r6">Opt-Out Request</strong>,
            'You may opt out of receiving future marketing communications from us at any time by using the unsubscribe link in our email communications or by contacting us directly. For mobile application notifications, you may adjust your notification settings on your device. You may also disable cookies through your browser settings. However, disabling cookies may affect how our website functions and may limit your ability to access certain features.',
          ],
        },
        {
          heading: 'Cookies',
          body: [
            'Our website may use cookies and similar technologies to improve your browsing and shopping experience.',
            'Cookies help us understand how customers use our website, remember your preferences, improve website performance, and provide relevant content, offers, and advertisements.',
            'You may disable cookies by changing your browser settings. However, if you disable cookies, some features of our website may not function properly.',
          ],
        },
        {
          heading: 'Payment Information',
          body: [
            'When you make a purchase through our website or mobile application, your payment information may be processed by third-party payment service providers.',
            'We do not store full payment card details unless permitted by applicable law and required for transaction processing, refunds, fraud prevention, or customer support.',
            'Payment service providers are responsible for handling your payment information securely in accordance with their own policies and applicable laws.',
          ],
        },
        {
          heading: 'Order Fulfilment and Delivery',
          body: [
            'To fulfil and deliver your orders, we may share necessary information with logistics companies, delivery partners, warehouse teams, and customer support providers.',
            'This information may include your name, delivery address, contact number, order details, and any special delivery instructions provided by you.',
          ],
        },
        {
          heading: 'Returns, Refunds, and Customer Support',
          body: [
            'We may use your information to process returns, exchanges, refunds, warranty claims, complaints, and customer service requests.',
            'We may keep records of customer service communications to improve our service quality, resolve disputes, and comply with legal or operational requirements.',
          ],
        },
        {
          heading: "Children's Privacy",
          body: [
            'Our website and services are not intended for use by children without the involvement and consent of a parent or legal guardian.',
            'We do not knowingly collect personal information from children where parental or guardian consent is required by law.',
            'If we become aware that we have collected personal information from a child without proper consent, we will take reasonable steps to delete such information.',
          ],
        },
        {
          heading: 'Changes to This Privacy Policy',
          body: [
            'Our business may change from time to time, and this Privacy Policy may also be updated.',
            'We will post the latest version of this Privacy Policy on our website or mobile application. Any changes will become effective upon posting, unless otherwise stated.',
            'We may also send notices or reminders where appropriate, but you should check this Privacy Policy regularly for updates.',
            'Your continued use of our website, mobile application, or services after any update means that you accept the revised Privacy Policy.',
          ],
        },
        {
          heading: 'Limitation of Liability',
          body: [
            'To the maximum extent permitted by applicable law, Solo, its affiliates, partners, employees, officers, directors, service providers, or insurers shall not be liable for any indirect, incidental, special, exemplary, consequential, or punitive damages arising from the collection, use, transfer, processing, or storage of personal information, or from your access to and use of our website, mobile application, products, or services.',
          ],
        },
        {
          heading: 'Governing Law and Jurisdiction',
          body: [
            'This Privacy Policy shall be governed by the laws of the United Arab Emirates.',
            'Any claim, action, or dispute arising in connection with this Privacy Policy shall be subject to the jurisdiction of the appropriate courts of the United Arab Emirates.',
          ],
        },
        {
          heading: 'Contact Us',
          body: [
            'We welcome your questions, comments, and concerns about privacy. You may contact our Customer Care team using the details below:',
            <ul key="contact">
              <li>Email: <a href="mailto:info@solotestsite.site">info@solotestsite.site</a></li>
              <li>WhatsApp / Phone: <a href="tel:+971557133051">+971 55 713 3051</a></li>
              <li>Address: VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ, Ras Al Khaimah, United Arab Emirates</li>
            </ul>,
          ],
        },
      ]}
    />
  );
}
