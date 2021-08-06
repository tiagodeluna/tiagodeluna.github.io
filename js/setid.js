jQuery(document).ready(function() {
    const code = "dGlhZ29kZWx1bmFAaG90bWFpbC5jb20=";
    const emid = atob(code);
    $("#myid").html(emid);
    $("#ContactForm").attr("action","https://formspree.io/"+emid);
});