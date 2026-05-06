import LegalPage from '@/components/legal/LegalPage';

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      lastUpdated="May 2026"
      intro={
        <>
          <p>
            By accessing, registering, browsing, purchasing from, or continuing to use{' '}
            <strong>solotestsite.site</strong>, including our website, mobile application,
            or any related online services, you agree to be bound by these Terms &amp;
            Conditions and any other policies or legal documents published on our website.
          </p>
          <p>
            Please read these Terms &amp; Conditions carefully before placing an order
            through our website. By submitting an order on Solo, you agree to be bound by
            these Terms &amp; Conditions with immediate effect.
          </p>
          <p>
            If you do not agree with any of these terms, you should not use or access this
            website. The materials and content available on this website are protected by
            applicable copyright, trademark, and intellectual property laws.
          </p>
        </>
      }
      sections={[
        {
          heading: '1. Definitions',
          body: [
            <ul key="defs">
              <li><strong>Applicable Laws:</strong> means the applicable rules, regulations, and laws of the United Arab Emirates.</li>
              <li><strong>Solo Services:</strong> means the use of any services, information, product details, features, content, or retail services available on our website.</li>
              <li><strong>Goods or Products:</strong> means any goods, products, or items available for sale on our website.</li>
              <li><strong>Customer, you, or your:</strong> means any person who browses, registers, places an order, or purchases products from our website.</li>
              <li><strong>Website, Platform, or Solo:</strong> means our retail website, solotestsite.site, including any mobile application or related digital platform operated by us.</li>
              <li><strong>we, us, or our:</strong> means Solo, operating the retail website solotestsite.site, including its employees, representatives, contractors, agents, and service providers.</li>
            </ul>,
          ],
        },
        {
          heading: '2. Online Retail Website',
          body: [
            'Solo is an online retail website. We sell products directly to customers through our website. When you place an order on our website, the contract of sale is between you and Solo.',
            'We are responsible for processing your order, arranging delivery, handling customer service, and managing returns, refunds, or replacements in accordance with these Terms & Conditions and our applicable policies.',
          ],
        },
        {
          heading: '3. Electronic Communications',
          body: [
            'We may communicate with you electronically through various methods, including but not limited to email, SMS, WhatsApp, phone calls, website notifications, application notifications, or other digital communication channels.',
            'By using our website or communicating with us electronically, you agree that such communications satisfy any legal requirement that communications be in writing, where permitted by applicable law.',
          ],
        },
        {
          heading: '4. No Misuse or False Representation',
          body: [
            'You may not publicly represent or imply that Solo, or any of its employees, representatives, or partners has sponsored, approved, endorsed, or authorised any use of our name, website, products, services, content, or materials without our prior written approval.',
            'We reserve the right to take legal action against any unauthorised use, false representation, misuse, or fraudulent use of our website, brand, content, or services.',
          ],
        },
        {
          heading: '5. Product Recommendations',
          body: [
            'We may recommend products, offers, or services that may be of interest to you based on your browsing history, search preferences, previous orders, general customer behaviour, or our retail experience.',
            'You have the right to ignore or avoid such recommendations.',
          ],
        },
        {
          heading: '6. Account Registration & Security',
          body: [
            'To access certain features of the website, you may be required to create an account and complete a registration process.',
            'If you create an account, you agree to provide accurate, current, and complete information. You also agree to update your account information when necessary to keep it accurate and complete.',
            'All information you provide through the website is governed by our Privacy Policy, and you consent to our use of your information in accordance with that Privacy Policy.',
            'You are responsible for maintaining the confidentiality of your username, password, and account details. You are fully responsible for all activities that occur under your account.',
            'You must notify us immediately if you suspect any unauthorised use of your account, password, or any other security breach.',
            'We reserve the right, at our sole discretion and without prior notice, to suspend, restrict, or terminate your account or access to the website if we believe you have violated these Terms & Conditions, misused the website, or engaged in suspicious or unlawful activity.',
          ],
        },
        {
          heading: '7. Intellectual Property Rights',
          body: [
            'The website and all of its content, features, and functionality, including but not limited to text, product descriptions, images, graphics, videos, logos, icons, designs, layouts, software, and other materials, are owned by or licensed to Solo.',
            'All such content is protected by copyright, trademark, trade secret, and other intellectual property laws.',
            'You may not copy, reproduce, distribute, modify, display, publish, sell, or exploit any part of our website or content without our prior written approval.',
            <>If you believe that your intellectual property rights have been infringed on our website, please contact us immediately at: <a href="mailto:info@solotestsite.site">info@solotestsite.site</a>.</>,
          ],
        },
        {
          heading: '8. Use of the Website',
          body: [
            'You may use our website only for lawful browsing, account management, and purchase purposes.',
            'You may be allowed to post reviews, ratings, comments, feedback, suggestions, or questions where such features are available.',
            'You are prohibited from posting or submitting anything that:',
            <ul key="prohib">
              <li>Violates any applicable law or regulation.</li>
              <li>Encourages unlawful activity.</li>
              <li>Is defamatory, abusive, threatening, harassing, obscene, indecent, or offensive.</li>
              <li>Infringes any intellectual property right or privacy right.</li>
              <li>Misrepresents your identity.</li>
              <li>Contains false, misleading, or fraudulent information.</li>
              <li>Includes unauthorised advertising, spam, or promotional content.</li>
              <li>Damages or negatively affects our website, business, reputation, customers, or services.</li>
            </ul>,
            'You represent and warrant that any content, feedback, review, or comment you submit is accurate, lawful, and does not violate the rights of any third party.',
            'We reserve the right to review, reject, edit, or remove any content posted by you at any time, with or without notice.',
            'You agree to indemnify and hold Solo harmless from any claims, damages, losses, or expenses arising from content, comments, reviews, or materials submitted by you.',
          ],
        },
        {
          heading: '9. Solo Liability',
          body: [
            'We will make reasonable efforts to provide a reliable and uninterrupted retail service to our customers.',
            'However, we do not guarantee that the website will always be available, uninterrupted, error-free, or free from technical issues.',
            'We shall not be liable for losses caused by events beyond our reasonable control, including technical failures, internet interruptions, natural disasters, government actions, labour disputes, logistics disruptions, or other force majeure events.',
            'This does not affect your legal rights to receive goods within a reasonable time or to receive a refund where goods cannot be supplied in accordance with applicable law and these Terms & Conditions.',
          ],
        },
        {
          heading: '10. Amendments',
          body: [
            'We reserve the right to modify, update, or amend these Terms & Conditions at any time.',
            'Any changes will be posted on our website and will become effective once published, unless otherwise stated.',
            'Your continued use of the website after any changes means that you accept the updated Terms & Conditions.',
            'You are encouraged to review these Terms & Conditions regularly.',
          ],
        },
        {
          heading: '11. Your Order',
          body: [
            <strong key="11a">11.1 Placing an Order</strong>,
            'You may purchase products by placing and completing an order through our website. When placing an order, you will be required to provide certain information, including your contact details, delivery address, billing details, and payment information.',
            'You are responsible for ensuring that all information provided is accurate and complete. By placing an order, you agree to comply with these Terms & Conditions, our Privacy Policy, and any other policies applicable to your purchase.',
            <strong key="11b">11.2 Order Acceptance</strong>,
            'Your order will be considered accepted only when we confirm acceptance by email, SMS, WhatsApp, or any other written communication. Submitting an order form or completing checkout does not automatically mean that your order has been accepted.',
            'We reserve the right to reject or cancel an order for any valid reason, including but not limited to product unavailability, pricing errors, payment issues, suspected fraud, incorrect information, or delivery restrictions.',
            <strong key="11c">11.3 Payment Confirmation</strong>,
            'Your order may only be processed after successful payment confirmation, unless cash on delivery or another payment method is specifically made available on our website.',
            <strong key="11d">11.4 Order Cancellation by Customer</strong>,
            'You may request to cancel your order before it has been shipped or dispatched. Once the order has been shipped, cancellation may no longer be possible, and the return process may apply instead.',
            <strong key="11e">11.5 Order Cancellation by Us</strong>,
            'We reserve the right to cancel your order in cases including: missing required information, payment failure, product unavailability, pricing or description errors, inability to deliver to your location, you being unavailable after reasonable delivery attempts, suspected fraud, or orders exceeding purchase quantity limits.',
          ],
        },
        {
          heading: '12. Delivery of Your Order',
          body: [
            'Products will be delivered to the address provided by you during checkout. You are responsible for ensuring that the delivery address and contact details are accurate and complete.',
            'We will make reasonable efforts to deliver your order within the estimated delivery timeframe provided at checkout or communicated to you after order confirmation. Delivery dates and times are estimates and may be affected by circumstances beyond our control.',
            'If there is a delay in delivering your order, we will make reasonable efforts to contact you and provide a revised estimated delivery date.',
            'If you are unavailable at the delivery address, we may contact you to arrange redelivery. Additional delivery charges may apply for repeated delivery attempts, depending on the circumstances.',
            'We reserve the right to refuse, cancel, or restrict delivery of any order that violates these Terms & Conditions, applicable law, or our operational policies.',
          ],
        },
        {
          heading: '13. Shipping',
          body: [
            'Shipping fees, delivery times, and available delivery options may vary depending on the product, delivery location, order value, and shipping method selected.',
            'Shipping charges, if applicable, will be shown during checkout before you confirm your order.',
            'We may offer standard delivery, express delivery, free delivery, or other delivery options from time to time.',
            'If customs duties, import charges, taxes, or other fees apply to deliveries outside the UAE, such charges shall be the responsibility of the customer unless clearly stated otherwise during checkout.',
            'Shipment status updates may be provided through email, SMS, WhatsApp, website notifications, or tracking links where available.',
          ],
        },
        {
          heading: '14. Returns, Refunds & Replacements',
          body: [
            <strong key="14a">14.1 Cancellation</strong>,
            'You may cancel your order only if your cancellation request is received before the order is shipped or dispatched. If payment was made by credit card, debit card, or another electronic payment method and the cancellation is accepted, the refund will be processed according to the payment provider\'s timeline.',
            <strong key="14b">14.2 Return, Refund, or Replacement</strong>,
            'We aim to provide a smooth customer experience and may accept returns, refunds, or replacements in accordance with our return policy. Return eligibility may depend on the product type, condition, reason for return, packaging, and the time passed since delivery.',
            <strong key="14c">14.3 Return Procedure</strong>,
            <>To request a return, please contact us through email at <a href="mailto:info@solotestsite.site">info@solotestsite.site</a> or phone <a href="tel:+971557133051">+971 55 713 3051</a>.</>,
            'When submitting a return request, please provide: order number, product name, reason for return, photos or videos (if the product is damaged, defective, incorrect, or incomplete), and your contact details. If your return request is approved, we will provide instructions for collection, drop-off, or return shipment.',
            <strong key="14d">14.4 Return Policy</strong>,
            'All returns are subject to prior approval. Unauthorised returns may be refused or returned to the customer at the customer\'s expense.',
            <ul key="14ul">
              <li>Returns for damaged, defective, or wrong items should be submitted as soon as possible after receiving the order.</li>
              <li>Products must be returned unused, undamaged, and in their original packaging, with all tags, labels, accessories, manuals, and invoices where applicable.</li>
              <li>Returned products will be inspected before approval of refund, replacement, or exchange.</li>
              <li>Items damaged due to customer misuse, improper handling, unauthorised repair, or normal wear and tear may not be accepted.</li>
              <li>Certain products may not be eligible for return, refund, or exchange for hygiene, safety, customisation, clearance, or final sale reasons.</li>
              <li>Discounted or promotional items may be final sale unless defective or incorrectly supplied.</li>
              <li>Gift cards, digital products, or vouchers may not be returned or exchanged for cash unless required by law.</li>
            </ul>,
            <strong key="14e">14.5 Eligible Return Cases</strong>,
            'You may be eligible to return, replace, or exchange products in the following cases: you received the wrong product; the product was damaged or defective upon delivery; the product was materially different from the description on our website; the product does not meet the agreed specification (such as wrong size, colour, or model); the product was not opened, used, damaged, or altered by you; or any other case approved by us or required by applicable law.',
            <strong key="14f">14.6 Refund Method</strong>,
            'Approved refunds will generally be processed using the original payment method, unless another refund method is agreed or required. Refund processing times may vary depending on the payment provider, bank, or payment method used.',
          ],
        },
        {
          heading: '15. Price',
          body: [
            'The price of the products shall be the price listed on our website at the time you place your order.',
            'Prices may include or exclude VAT, taxes, shipping fees, customs duties, or other charges depending on what is clearly stated during checkout.',
            'We reserve the right to correct pricing errors, product description errors, or promotional errors at any time.',
            'If an error affects your order, we may contact you to confirm whether you wish to proceed at the corrected price or cancel the order.',
          ],
        },
        {
          heading: '16. Payment',
          body: [
            'To complete your order, you must make payment using one of the payment methods available on our website.',
            'All payments must be made directly through our approved payment channels. We are not responsible for payments made outside our approved payment methods.',
            'By submitting payment details, you authorise us and/or our authorised third-party payment processors to process your payment for the order.',
            'We may use third-party payment processors to securely process credit cards, debit cards, digital wallets, or other electronic payment methods. By using these payment methods, you may also be subject to the terms and conditions of the relevant payment service provider.',
            'We may add, remove, modify, suspend, or discontinue any payment method at any time without prior notice.',
          ],
        },
        {
          heading: '17. Defect or Damage to Ordered Goods',
          body: [
            <>If you receive a damaged, defective, incorrect, or incomplete product, you must notify us as soon as possible at: <a href="mailto:info@solotestsite.site">info@solotestsite.site</a> or <a href="tel:+971557133051">+971 55 713 3051</a>.</>,
            'We may request photos, videos, order details, packaging images, or other evidence to review the issue.',
            'If the defect or damage is confirmed, we may offer a replacement, repair, refund, store credit, or another suitable remedy in accordance with applicable law and our return policy.',
            'We are not responsible for damage caused by misuse, improper installation, unauthorised repair, alteration, negligence, or failure to follow product instructions.',
          ],
        },
        {
          heading: '18. Warranties, Guarantees & Undertakings',
          body: [
            <strong key="18a">18.1 Customer Undertakings</strong>,
            'You warrant, guarantee, and undertake that you will: comply with all applicable laws and regulations; provide accurate and complete information when using our website or placing an order; have full legal capacity and authority to enter into these Terms & Conditions; make payments lawfully using payment methods that you are authorised to use; use the website only for lawful purposes; not misuse, damage, interfere with, or attempt to gain unauthorised access to our website, systems, or customer data; not use another person\'s account or personal information without authorisation; notify us immediately if you suspect unauthorised use of your account; provide information reasonably required to process, deliver, or support your order; and indemnify and hold us harmless from claims, losses, damages, costs, and expenses arising from your misuse of the website, breach of these Terms & Conditions, violation of applicable law, or infringement of third-party rights.',
            <strong key="18b">18.2 Website and Service Disclaimer</strong>,
            'Our website and services are provided on an "as is" and "as available" basis. To the extent permitted by law, we make no warranties that the website will be uninterrupted, error-free, secure, or free from harmful components.',
            'Nothing in these Terms & Conditions limits any warranty, guarantee, or consumer protection right that cannot be excluded under applicable law.',
          ],
        },
        {
          heading: '19. Liability',
          body: [
            'To the fullest extent permitted by applicable law, Solo, including its employees, representatives, contractors, service providers, directors, officers, suppliers, subcontractors, or licensors, shall not be liable for:',
            <ul key="liab">
              <li>Loss of profits, loss of data, loss of business, loss of goodwill, or failure to realise anticipated savings.</li>
              <li>Indirect, incidental, special, consequential, exemplary, or punitive damages.</li>
              <li>Website downtime, technical errors, or interruptions.</li>
              <li>Delays caused by logistics companies, customs authorities, payment providers, or events beyond our reasonable control.</li>
              <li>Damage caused by customer misuse, improper handling, unauthorised repair, or failure to follow product instructions.</li>
              <li>Any loss caused by incorrect information provided by the customer.</li>
            </ul>,
            'This limitation does not exclude liability that cannot be excluded under applicable law.',
          ],
        },
        {
          heading: '20. Customs Duty',
          body: [
            'When ordering products for delivery outside the UAE, you may be subject to import duties, taxes, customs charges, or other fees imposed by the destination country.',
            'Any such charges shall be borne by you unless clearly stated otherwise during checkout.',
            'We do not control customs authorities and are not responsible for delays or charges caused by customs clearance procedures.',
          ],
        },
        {
          heading: '21. Force Majeure',
          body: [
            'We will not be liable for any delay or failure to perform our obligations where such delay or failure results from causes beyond our reasonable control, including but not limited to acts of God, natural disasters, labour disputes, transportation disruptions, internet failures, utility failures, government actions, customs delays, epidemics, pandemics, war, terrorism, civil unrest, or other events outside our control.',
          ],
        },
        {
          heading: '22. Notices',
          body: [
            'To contact us regarding these Terms & Conditions, orders, returns, complaints, or customer service matters, please use the details below:',
            <ul key="notices">
              <li>Email: <a href="mailto:info@solotestsite.site">info@solotestsite.site</a></li>
              <li>Phone / WhatsApp: <a href="tel:+971557133051">+971 55 713 3051</a></li>
            </ul>,
          ],
        },
        {
          heading: '23. No Waiver',
          body: [
            'Our failure to enforce any provision of these Terms & Conditions shall not be considered a waiver of that provision or of our right to enforce it later. Any waiver must be made in writing to be effective.',
          ],
        },
        {
          heading: '24. Severability',
          body: [
            'If any part of these Terms & Conditions is found to be invalid, illegal, or unenforceable, the remaining parts shall remain valid and enforceable. The invalid or unenforceable part shall be interpreted, where possible, in a way that best reflects the original intention.',
          ],
        },
        {
          heading: '25. Governing Law and Jurisdiction',
          body: [
            'These Terms & Conditions shall be governed by and interpreted in accordance with the laws of the United Arab Emirates.',
            'Any disputes or claims arising out of or in connection with these Terms & Conditions shall be subject to the exclusive jurisdiction of the courts of the United Arab Emirates, unless otherwise required by applicable law.',
          ],
        },
        {
          heading: '26. Entire Agreement',
          body: [
            'These Terms & Conditions, together with our Privacy Policy and any other policies published on our website, form the entire agreement between you and Solo regarding your use of solotestsite.site and your purchase of products from us.',
            'They replace any previous agreements, understandings, communications, or representations, whether written or verbal.',
          ],
        },
        {
          heading: '27. English Version Shall Prevail',
          body: [
            'If these Terms & Conditions are translated into another language and there is any inconsistency or conflict between the English version and the translated version, the English version shall prevail.',
          ],
        },
        {
          heading: '28. Contact Details',
          body: [
            'For any questions, concerns, complaints, order support, returns, or notices, you may contact us at:',
            <ul key="contact">
              <li>Website: solotestsite.site</li>
              <li>Email: <a href="mailto:info@solotestsite.site">info@solotestsite.site</a></li>
              <li>Phone / WhatsApp: <a href="tel:+971557133051">+971 55 713 3051</a></li>
              <li>Address: VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ, Ras Al Khaimah, United Arab Emirates</li>
            </ul>,
          ],
        },
      ]}
    />
  );
}
