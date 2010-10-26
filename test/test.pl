#!/site/bin/perl

use strict;
use warnings;

use feature ':5.10';
use LWP::UserAgent;


my $ua = LWP::UserAgent->new();

my @players = (
    { caller_name => 'Max',       caller_number => 5550000001 },
    { caller_name => 'Hemingway', caller_number => 5550000002 },
    { caller_name => 'Willie',    caller_number => 5550000003 },
    { caller_name => 'Waylon',    caller_number => 5550000004 },
    { caller_name => 'Robert',    caller_number => 5550000005 },
    { caller_name => 'Enzo',      caller_number => 5550000006 },
);

ping();
for (@players) {
    register($_);
}


get_question($players[0]);
get_question($players[0]);
get_question($players[0]);
get_question($players[1]);
get_question($players[2]);

answer($players[0], 3);
answer($players[0], 3);
answer($players[0], 3);
answer($players[0], 160);
answer($players[1], 3);
answer($players[2], 3);

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
    my ($player) = @_;
    my $form;
    $form->{caller_name} = $player->{caller_name};
    $form->{caller_number} = $player->{caller_number};
    $form->{caller_email} = 'sigh@sigh.com';
    my $r = $ua->post('http://uw.makehistory.com/register', $form);
    if ($r->is_success) {
        say "Registered $form->{caller_name}";
    }
    else {
        say "Register NOT OK: " . $r->status_line;
    }
}

# GET
sub get_question {
    my ($player) = @_;
    my $r = $ua->get("http://uw.makehistory.com/vxml/question?caller=$player->{caller_number}");
    if ($r->is_success) {
        say "Got question OK";
    }
    else {
        say "Question NOT OK: " . $r->status_line;
    }
}

# GET
sub answer {
    my ($player, $answer) = @_;
    my $r = $ua->get("http://uw.makehistory.com/vxml/question?caller=$player->{caller_number}&answer=$answer");
    if ($r->is_success) {
        say "Answered OK";
    }
    else {
        say "Answer NOT OK: " . $r->status_line;
    }
}
