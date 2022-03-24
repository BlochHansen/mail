document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});



function compose_email(mail) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  if (document.querySelector('#email-view')) {
    document.querySelector('#email-view').style.display = 'none';
  }

  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-body').value = '';

  if (mail.sender) {
    document.querySelector('#compose-subject').value = `${mail.subject}`;
    document.querySelector('#compose-recipients').value = `${mail.sender}`;
    document.querySelector('#compose-body').autofocus = true;
    document.querySelector('#compose-body').value = `${mail.body.replace(/(?:<br>)/g, "\n")}`;
  }

  document.querySelector('#compose-form').onsubmit = function() {
    const recip   = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const txtBody = document.querySelector('#compose-body').value;

    // Save email
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recip,
        subject: subject,
        body: txtBody
      })
    })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
      if (result.message === 'Email sent successfully.') {
        load_mailbox('sent');
      };

      if (result.error) {
        if (result.error.startsWith('User with email')) {
          alert(result.error);
        }
      }; 
    })
    return false;
  };
}



function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';

  // remove 'email-view'
  if (document.querySelector('#email-view')) {
    const x = document.getElementById('email-view').remove();
  }

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Henter emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      let id = email.id;
      let sender = email.sender;
      let subj = email.subject;
      const tid = email.timestamp;
      let read = email.read;

      if (read == true) {
        bg = 'bg-light abh';
      } else {
        bg = 'bg-white text-dark';
      }

      let element = document.createElement('div');
      element.className = `p-3 mb-0 border border-dark ${bg}`;
      element.innerHTML = `<div class="row"><div class="col-sm-2">${sender}</div><div class="col-md-6">${subj}</div><div class="col-sm-4 text-right">${tid}</div></div></div>`;
      element.addEventListener('click', () => {
        load_email(`${id}`,`${mailbox}`);
      });
      document.querySelector('#emails-view').append(element);  
    });
  });

}



function load_email(id, mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  
  // Her dannes Div til email
  let element = document.createElement('div');
  element.id = 'email-view';
  element.style = 'display: block';
  document.querySelector('.container').append(element)

  // Hent data
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    // print email
    const id = email.id;
    const sender = email.sender;
    const recipients = email.recipients;
    let subject = email.subject;
    let body = email.body;
    const timestamp = email.timestamp;

    let element = document.createElement('div');
    element.id = 'email-top';
    element.innerHTML = `<div><b>From:</b> ${sender}</div>`;
    element.innerHTML += `<div><b>To:</b> ${recipients}</div>`;
    element.innerHTML += `<div><b>Subject:</b> ${subject}</div>`;
    element.innerHTML += `<div><b>Timestamp:</b> ${timestamp}</div>`;
    document.querySelector('#email-view').append(element);
   
    if (mailbox === 'inbox') {

      // Reply button dannes
      let button_reply = document.createElement('button');
      button_reply.type = 'button';
      button_reply.id = 'button_Reply';
      button_reply.className = 'btn btn-sm mr-2 btn-outline-primary';
      button_reply.innerHTML = 'Reply';
      button_reply.addEventListener('click', () => {
        // Find værdier der skal med i compose        
        // Skal sætte Re: på subject, hvis det ikke er sket
        if (!subject.startsWith('Re:')) {
          subject = `Re: ${subject}`;
        }
        body = `\n\n\n\------------------------------------------\nOn ${timestamp} ${sender} wrote:\n${body}`;

        let mail = {
          "sender": sender,
          "subject": subject,
          "body": body
        };
        compose_email(mail);
      });
      document.querySelector('#email-top').append(button_reply);

      // Archive button flyt til dannes
      let button_arch = document.createElement('button');
      button_reply.type = 'button';
      button_arch.className = 'btn btn-sm btn-outline-primary';
      button_arch.id = 'button_Arch';
      button_arch.innerHTML = 'Archive';
      button_arch.addEventListener('click', () => {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: true
          })
        })
        // Opdater inbox
        fetch(`/emails/inbox`)
        .then(response => response.json());

        load_mailbox('inbox');
      });
      document.querySelector('#email-top').append(button_arch);
    }
    else if (mailbox === 'archive') {
      
      // Archive button dannes til at fjerne status
      let button_arch = document.createElement('button');
      button_arch.className = 'btn btn-sm btn-outline-primary';
      button_arch.id = 'button_Arch';
      button_arch.innerHTML = 'Unarchive';
      button_arch.addEventListener('click', () => {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: false
          })
        })
        .then(response => response.json())
        .then(result => {
          console.log(result);
          
        });
        // Opdater inbox
        fetch(`/emails/inbox`)
        .then(response => response.json());

        load_mailbox('inbox');
      });
      document.querySelector('#email-top').append(button_arch);
    
    };

    let element2 = document.createElement('div');
    body = body.replace(/(?:\r\n|\r|\n)/g, "<br>");
    element2.innerHTML = `<hr><div>${body}</div>`;
    document.querySelector('#email-view').append(element2);
     
    // Email registreres som læst
    if (email.read === false) {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      });
    };

  });
  
}  