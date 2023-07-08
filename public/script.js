// counting no. of seats selected and the price
const container = document.querySelector(".container");
const seats = document.querySelectorAll(".row-seating .seat:not(.occupied");
const count = document.getElementById("count");
const total = document.getElementById("total");
const ticketPrice = document.getElementsByClassName("text")[0].getAttribute("name");
const countChild = document.getElementById("countChild");
const priceChild = document.getElementById("priceChild");

console.log(container);
console.log(seats);
console.log(count);
console.log(total);
console.log(ticketPrice);

//update total and count
function updateSelectedCount(){
   const selectedSeats = document.querySelectorAll(".row-seating .seat.selected");

   const seatsIndex = [...selectedSeats].map(function(seat){
      return [...seats].indexOf(seat);
   });
   const selectedSeatsCount = selectedSeats.length;

   count.innerText = selectedSeatsCount;
   countChild.setAttribute("value", selectedSeatsCount);
   console.log(count.innerText);
   total.innerText = selectedSeatsCount * ticketPrice;
   priceChild.setAttribute("value", total.innerText);
   console.log(total.innerText);
}

seats.forEach(function (seat) {
   seat.addEventListener('click', (e) => {
      if((e.target.classList.contains('seat')) && !(e.target.classList.contains('occupied'))){
         e.target.classList.toggle('selected');
      }
      updateSelectedCount();
   });
})
