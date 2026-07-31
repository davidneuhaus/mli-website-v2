addEventListener('render', function() {





    // Auto Collapsed List
    //
    $('ul.bullet-list li.active:first').each(function() {
        $(this).parents('ul.collapse').each(function() {
            $(this).addClass('show').prevAll('.collapse-caret:first').removeClass('collapsed');
        });
    });

    // Popovers
    //
    $('[data-bs-toggle="popover"]').each(function() {
        var $el = $(this);
        if ($el.data('content-target')) {
            $el
                .popover({ html: true, content: $($el.data('content-target')).get(0) })
                .on('shown.bs.popover', function() {
                    $('input:first', $($el.data('content-target'))).focus();
                })
            ;
        }
        else {
            $el.popover();
        }
    });

    // How it is made
    //
    setTimeout(function() {
        $('.how-its-made').removeClass('init');
    }, 1);

    // Toasts
    //
    var toastElList = [].slice.call(document.querySelectorAll('.toast'))
    var toastList = toastElList.map(function (toastEl) {
      return new bootstrap.Toast(toastEl, option)
    });

el_autohide = document.querySelector('.autohide');
  
  // add padding-top to body (if necessary)
  navbar_height = document.querySelector('.navbar').offsetHeight;
  

  if(el_autohide){
    var last_scroll_top = 0;
    window.addEventListener('scroll', function() {
          let scroll_top = window.scrollY;
         if(scroll_top < last_scroll_top) {
              el_autohide.classList.remove('scrolled-down');
              el_autohide.classList.add('scrolled-up');
          }
          else {
              el_autohide.classList.remove('scrolled-up');
              el_autohide.classList.add('scrolled-down');
          }
          last_scroll_top = scroll_top;
    }); 
    // window.addEventListener
  }
  // if
if (window.innerWidth > 992) {
  document.querySelectorAll('.navbar .nav-item').forEach(function(everyitem){

		everyitem.addEventListener('mouseover', function(e){

			let el_link = this.querySelector('a[data-bs-toggle]');

			if(el_link != null){
				let nextEl = el_link.nextElementSibling;
				el_link.classList.add('show');
				nextEl.classList.add('show');
			}

		});
		everyitem.addEventListener('mouseleave', function(e){
			let el_link = this.querySelector('a[data-bs-toggle]');

			if(el_link != null){
				let nextEl = el_link.nextElementSibling;
				el_link.classList.remove('show');
				nextEl.classList.remove('show');
			}


		})
	});
}



// Counter


       // Zielwert und Startwert
        const target = 130;
        let current = 0;
        const counterElement = document.getElementById("counter");

        // Funktion zum Hochzählen der Zahl mit Dezimalstellen
        function animateCounter() {
            if (current < target) {
                current++; // Inkrement um 0.1 für Dezimalstellen
                
                counterElement.textContent = current; // Zeigt die Zahl mit einer Dezimalstelle an
                setTimeout(animateCounter, 20);  // Wiederhole die Funktion alle 50ms
            }
		
        }
		

        // Intersection Observer einrichten, um zu prüfen, ob das Element im Sichtbereich ist
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Startet die Animation, wenn das Element sichtbar ist
                    animateCounter();
                    observer.unobserve(entry.target); // Beobachtung nach dem Starten der Animation stoppen
                }
            });
        }, { threshold: 0.5 }); // Beobachte, ob mindestens 50% des Elements sichtbar sind

        // Beobachte das counterElement
        observer.observe(counterElement);


          // Zielwert und Startwert
        const target1 = 1100;
        let current1 = 0;
        const counterElement1 = document.getElementById("counter1");

        // Funktion zum Hochzählen der Zahl mit Dezimalstellen
        function animateCounter1() {
            if (current1 < target1) {
                current1++; // Rundet auf eine Dezimalstelle
                counterElement1.textContent = current1; // Zeigt die Zahl mit einer Dezimalstelle an
                setTimeout(animateCounter1, 1);  // Wiederhole die Funktion alle 50ms
            }
		
        }
		

        // Intersection Observer einrichten, um zu prüfen, ob das Element im Sichtbereich ist
        const observer1 = new IntersectionObserver((entries1) => {
            entries1.forEach(entry1 => {
                if (entry1.isIntersecting) {
                    // Startet die Animation, wenn das Element sichtbar ist
                    animateCounter1();
                    observer1.unobserve(entry1.target1); // Beobachtung nach dem Starten der Animation stoppen
                }
            });
        }, { threshold: 0.5 }); // Beobachte, ob mindestens 50% des Elements sichtbar sind

        // Beobachte das counterElement
        observer1.observe(counterElement1);

          // Zielwert und Startwert
        const target2 = 160;
        let current2 = 0;
        const counterElement2 = document.getElementById("counter2");

        // Funktion zum Hochzählen der Zahl mit Dezimalstellen
        function animateCounter2() {
            if (current2 < target2) {
                current2++;
                counterElement2.textContent = current2;
                setTimeout(animateCounter2, 20);  // Wiederhole die Funktion alle 50ms
            }
        }

           // Intersection Observer einrichten, um zu prüfen, ob das Element im Sichtbereich ist
        const observer2 = new IntersectionObserver((entries2) => {
            entries2.forEach(entry2 => {
                if (entry2.isIntersecting) {
                    // Startet die Animation, wenn das Element sichtbar ist
                    animateCounter2();
                    observer2.unobserve(entry2.target); // Beobachtung nach dem Starten der Animation stoppen
                }
            });
        }, { threshold: 0.5 }); // Beobachte, ob mindestens 50% des Elements sichtbar sind

        // Beobachte das counterElement
        observer2.observe(counterElement2);


});