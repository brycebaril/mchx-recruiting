#!/site/bin/perl

use strict;
use warnings;

use feature ':5.10';
use LWP::UserAgent;


my $ua = LWP::UserAgent->new();

ping();


# GET
sub ping {
    my $r = $ua->get('http://uw.makehistory.com/ping');
    if ($r->is_success) {
        say "Ping OK";
    }
    else {
        say "Ping NOT OK: " . $r->status_line;
    }
}

# register participant
# POST
sub register {
}

# GET
sub get_question {
}

# GET
sub post_answer {
}
