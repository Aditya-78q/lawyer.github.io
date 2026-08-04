<script>
  if (window.location.pathname.endsWith('.html')) {
    const cleanUrl = window.location.pathname.replace('.html', '');
    window.location.replace(cleanUrl);
  }
</script>
